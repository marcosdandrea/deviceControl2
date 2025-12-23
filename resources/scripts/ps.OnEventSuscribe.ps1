$ErrorActionPreference = "Stop"

function Normalize-Arr($v) {
  if ($null -eq $v) { return @() }
  if ($v -is [System.Array]) { return @($v) }
  return @($v)
}

function FirstIPv4($arr) {
  foreach ($x in (Normalize-Arr $arr)) {
    if ($x -is [string] -and $x.Contains(".")) { return $x }
  }
  return $null
}

function ArrEq($a, $b) {
  $aa = (Normalize-Arr $a) | ForEach-Object { "$_" }
  $bb = (Normalize-Arr $b) | ForEach-Object { "$_" }
  if ($aa.Count -ne $bb.Count) { return $false }
  for ($i=0; $i -lt $aa.Count; $i++) {
    if ($aa[$i] -ne $bb[$i]) { return $false }
  }
  return $true
}

function AddChange([System.Collections.ArrayList]$list, $field, $from, $to) {
  $null = $list.Add([ordered]@{ field=$field; from=$from; to=$to })
}

function IsWifiLikeText($text) {
  if ($null -eq $text) { return $false }
  return ($text -match "Wi-?Fi|Wireless|WLAN|802\.11")
}

function IsEthernetAdapterInstance($a) {
  # $a es Win32_NetworkAdapter (TargetInstance)
  # Filtros best-effort:
  # - AdapterTypeID=0 suele ser Ethernet 802.3
  # - Excluir Wi-Fi por textos
  # - Requiere NetConnectionID (nombre visible) para operar mejor
  if ($null -eq $a) { return $false }

  if ($null -eq $a.NetConnectionID -or "$($a.NetConnectionID)".Trim().Length -eq 0) { return $false }

  # AdapterTypeID: 0 = Ethernet 802.3 (muy útil para filtrar Wi-Fi)
  if ($null -ne $a.AdapterTypeID) {
    if ([int]$a.AdapterTypeID -ne 0) { return $false }
  }

  # Filtro extra por texto
  $joined = "$($a.Name) $($a.NetConnectionID) $($a.AdapterType) $($a.Description)"
  if (IsWifiLikeText $joined) { return $false }

  return $true
}

function IsEthernetIpConfigInstance($c) {
  # $c es Win32_NetworkAdapterConfiguration (TargetInstance)
  # No hay NetConnectionID aquí, así que filtramos por Description
  if ($null -eq $c) { return $false }
  $desc = "$($c.Description)"
  if (IsWifiLikeText $desc) { return $false }
  return $true
}

function DetectAdapterChanges($prev, $curr) {
  $changes = New-Object System.Collections.ArrayList

  if ($prev -and $curr) {
    if ("$($prev.NetConnectionStatus)" -ne "$($curr.NetConnectionStatus)") {
      AddChange $changes "netConnectionStatus" $prev.NetConnectionStatus $curr.NetConnectionStatus
    }
    if ("$($prev.NetEnabled)" -ne "$($curr.NetEnabled)") {
      AddChange $changes "netEnabled" $prev.NetEnabled $curr.NetEnabled
    }
    if ("$($prev.Speed)" -ne "$($curr.Speed)") {
      AddChange $changes "speed" $prev.Speed $curr.Speed
    }
  }

  # Clasificación: link si hay cambios en netConnectionStatus/netEnabled
  # speed solo lo consideramos ruido (lo filtramos más abajo)
  $changeType = "unknown"
  foreach ($c in $changes) {
    if ($c.field -in @("netConnectionStatus","netEnabled")) { $changeType = "link"; break }
  }
  if ($changeType -eq "unknown") {
    foreach ($c in $changes) {
      if ($c.field -eq "speed") { $changeType = "link"; break }
    }
  }

  return @{ changeType=$changeType; changes=$changes }
}

function DetectIpChanges($prev, $curr) {
  $changes = New-Object System.Collections.ArrayList

  if ($prev -and $curr) {
    $prevIp = FirstIPv4 $prev.IPAddress
    $currIp = FirstIPv4 $curr.IPAddress
    if ("$prevIp" -ne "$currIp") { AddChange $changes "ipv4Address" $prevIp $currIp }

    $prevMask = FirstIPv4 $prev.IPSubnet
    $currMask = FirstIPv4 $curr.IPSubnet
    if ("$prevMask" -ne "$currMask") { AddChange $changes "subnetMask" $prevMask $currMask }

    $prevGw = FirstIPv4 $prev.DefaultIPGateway
    $currGw = FirstIPv4 $curr.DefaultIPGateway
    if ("$prevGw" -ne "$currGw") { AddChange $changes "gateway" $prevGw $currGw }

    if ("$($prev.DHCPEnabled)" -ne "$($curr.DHCPEnabled)") {
      AddChange $changes "dhcpEnabled" $prev.DHCPEnabled $curr.DHCPEnabled
    }

    if (-not (ArrEq $prev.DNSServerSearchOrder $curr.DNSServerSearchOrder)) {
      AddChange $changes "dnsServers" (Normalize-Arr $prev.DNSServerSearchOrder) (Normalize-Arr $curr.DNSServerSearchOrder)
    }
  }

  $changeType = "unknown"
  foreach ($c in $changes) {
    if ($c.field -eq "ipv4Address") { $changeType = "ip"; break }
  }
  if ($changeType -eq "unknown") {
    foreach ($c in $changes) {
      if ($c.field -eq "gateway") { $changeType = "gateway"; break }
    }
  }
  if ($changeType -eq "unknown") {
    foreach ($c in $changes) {
      if ($c.field -eq "dnsServers") { $changeType = "dns"; break }
    }
  }
  if ($changeType -eq "unknown") {
    foreach ($c in $changes) {
      if ($c.field -eq "dhcpEnabled") { $changeType = "dhcp"; break }
    }
  }

  return @{ changeType=$changeType; changes=$changes }
}

# Limpieza
Get-EventSubscriber | Where-Object { $_.SourceIdentifier -in @("dc2-net-adapter","dc2-net-ip") } |
  Unregister-Event -Force -ErrorAction SilentlyContinue
Get-Event | Where-Object { $_.SourceIdentifier -in @("dc2-net-adapter","dc2-net-ip") } |
  Remove-Event -ErrorAction SilentlyContinue

# Adapter watcher (Ethernet-only en query: AdapterTypeID=0)
Register-WmiEvent -SourceIdentifier "dc2-net-adapter" -Query @"
SELECT * FROM __InstanceModificationEvent WITHIN 1
WHERE TargetInstance ISA 'Win32_NetworkAdapter'
AND TargetInstance.PhysicalAdapter = TRUE
AND TargetInstance.NetConnectionID IS NOT NULL
AND TargetInstance.AdapterTypeID = 0
"@ | Out-Null

# IP watcher (IPEnabled=true; filtraremos por Description dentro del loop)
Register-WmiEvent -SourceIdentifier "dc2-net-ip" -Query @"
SELECT * FROM __InstanceModificationEvent WITHIN 2
WHERE TargetInstance ISA 'Win32_NetworkAdapterConfiguration'
AND TargetInstance.IPEnabled = TRUE
"@ | Out-Null

Write-Output "__WMI_WATCHER_STARTED__"

while ($true) {
  $evt = Wait-Event -Timeout 2
  if ($null -eq $evt) { continue }

  if ($evt.SourceIdentifier -in @("dc2-net-adapter","dc2-net-ip")) {

    $newEvent = $evt.SourceEventArgs.NewEvent
    $curr = $newEvent.TargetInstance
    $prev = $newEvent.PreviousInstance

    $cls = $curr.__CLASS

    # Filtro: ignorar Wi-Fi / wireless
    if ($cls -eq "Win32_NetworkAdapter") {
      if (-not (IsEthernetAdapterInstance $curr)) {
        Remove-Event -EventIdentifier $evt.EventIdentifier -ErrorAction SilentlyContinue
        continue
      }
    }
    elseif ($cls -eq "Win32_NetworkAdapterConfiguration") {
      if (-not (IsEthernetIpConfigInstance $curr)) {
        Remove-Event -EventIdentifier $evt.EventIdentifier -ErrorAction SilentlyContinue
        continue
      }
    }

    $changeType = "unknown"
    $changes = @()

    if ($evt.SourceIdentifier -eq "dc2-net-adapter") {
      $res = DetectAdapterChanges $prev $curr
      $changeType = $res.changeType
      $changes = $res.changes

      # Filtro: ignorar ruido si el único cambio es speed
      if ($changes.Count -eq 1 -and $changes[0].field -eq "speed") {
        Remove-Event -EventIdentifier $evt.EventIdentifier -ErrorAction SilentlyContinue
        continue
      }
    }
    elseif ($evt.SourceIdentifier -eq "dc2-net-ip") {
      $res = DetectIpChanges $prev $curr
      $changeType = $res.changeType
      $changes = $res.changes

      # Si no detectamos cambios relevantes, ignorar
      if ($changes.Count -eq 0) {
        Remove-Event -EventIdentifier $evt.EventIdentifier -ErrorAction SilentlyContinue
        continue
      }
    }

    # Metadatos útiles para correlacionar en Node
    $iface = $null
    $guid = $null
    $mac = $null

    if ($cls -eq "Win32_NetworkAdapter") {
      $iface = $curr.NetConnectionID
      $guid = $curr.GUID
      $mac = $curr.MACAddress
    }
    elseif ($cls -eq "Win32_NetworkAdapterConfiguration") {
      $iface = $curr.Description
      $guid = $curr.SettingID
    }

    [ordered]@{
      topic="network.changed"
      reason=$evt.SourceIdentifier
      sourceClass=$cls
      changeType=$changeType
      interfaceName=$iface
      guid=$guid
      mac=$mac
      time=(Get-Date).ToString("o")
      changes=$changes
      current=@{
        ipv4Address = if ($cls -eq "Win32_NetworkAdapterConfiguration") { (FirstIPv4 $curr.IPAddress) } else { $null }
        gateway     = if ($cls -eq "Win32_NetworkAdapterConfiguration") { (FirstIPv4 $curr.DefaultIPGateway) } else { $null }
      }
    } | ConvertTo-Json -Compress -Depth 6
  }

  Remove-Event -EventIdentifier $evt.EventIdentifier -ErrorAction SilentlyContinue
}
