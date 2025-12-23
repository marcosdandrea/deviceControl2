$ErrorActionPreference="Stop";

function Normalize-Array($v) {
  if ($null -eq $v) { return @() }
  if ($v -is [System.Array]) { return @($v) }
  return @($v)
}

# Mejor-esfuerzo para Ethernet cableada:
# -Physical filtra bastante, pero puede incluir algunos virtuales dependiendo del driver
# Excluimos Wi-Fi por InterfaceDescription/Name (heurístico)
$adapters = Get-NetAdapter -Physical | Where-Object {
  $_.InterfaceAlias -ne $null -and
  $_.InterfaceDescription -notmatch "Wi-?Fi|Wireless"
};

$result = foreach ($a in $adapters) {
  $alias = $a.InterfaceAlias;

  $ipcfg = Get-NetIPConfiguration -InterfaceAlias $alias -ErrorAction SilentlyContinue;
  $ipif = Get-NetIPInterface -InterfaceAlias $alias -AddressFamily IPv4 -ErrorAction SilentlyContinue;
  $dns  = Get-DnsClientServerAddress -InterfaceAlias $alias -AddressFamily IPv4 -ErrorAction SilentlyContinue;

  $ipv4 = $null;
  $prefix = $null;

  if ($ipcfg -and $ipcfg.IPv4Address -and $ipcfg.IPv4Address.Count -gt 0) {
    $ipv4 = $ipcfg.IPv4Address[0].IPAddress;
    $prefix = $ipcfg.IPv4Address[0].PrefixLength;
  }

  $gw = $null;
  if ($ipcfg -and $ipcfg.IPv4DefaultGateway) {
    $gw = $ipcfg.IPv4DefaultGateway.NextHop;
  }

  $mask = $null
  if ($prefix -ne $null) {
    $bits = ('1' * $prefix).PadRight(32, '0')
    $octets = @(
      [Convert]::ToInt32($bits.Substring(0,8), 2),
      [Convert]::ToInt32($bits.Substring(8,8), 2),
      [Convert]::ToInt32($bits.Substring(16,8), 2),
      [Convert]::ToInt32($bits.Substring(24,8), 2)
    )
    $mask = ($octets -join '.')
  }

  [pscustomobject]@{
    interfaceName = $alias
    status = $a.Status
    dhcp = if ($ipif) { $ipif.Dhcp } else { $null }
    ipv4Address = $ipv4
    subnetMask = $mask
    gateway = $gw
    dnsServers = if ($dns) { Normalize-Array $dns.ServerAddresses } else { @() }
  }
}

$result | ConvertTo-Json -Depth 5
