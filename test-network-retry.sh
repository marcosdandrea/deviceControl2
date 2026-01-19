#!/bin/bash
# Script para probar los mecanismos de reintento de red en DeviceControl

echo "=== PRUEBA DE REINTENTOS DE RED ==="
echo "Fecha: $(date)"
echo ""

echo "1. Estado actual de la interfaz:"
cat /sys/class/net/eth0/operstate
ip addr show eth0 | head -5
echo ""

echo "2. Simulando interfaz DOWN temporalmente..."
sudo ip link set eth0 down
sleep 2
echo "Estado durante DOWN:"
cat /sys/class/net/eth0/operstate
echo ""

echo "3. Reactivando interfaz..."
sudo ip link set eth0 up
sleep 3
echo "Estado después de UP:"
cat /sys/class/net/eth0/operstate
ip addr show eth0 | head -5
echo ""

echo "4. La aplicación DeviceControl debería haber detectado estos cambios"
echo "   y realizado reintentos automáticamente."
echo ""
echo "=== FIN DE PRUEBA ==="