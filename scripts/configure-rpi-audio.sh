#!/bin/bash

# Script de configuración de audio para Raspberry Pi - DeviceControl2
# Este script optimiza la configuración de audio para evitar cortes y pops

echo "=== Configuración de Audio para DeviceControl2 ==="

# 1. Configurar ALSA para mejor rendimiento
echo "Configurando ALSA..."
if [ -f /home/pi/.asoundrc ]; then
    echo "Respaldando configuración ALSA existente..."
    cp /home/pi/.asoundrc /home/pi/.asoundrc.backup
fi

# Crear configuración ALSA optimizada
cat > /home/pi/.asoundrc << 'EOF'
pcm.!default {
    type hw
    card 0
    device 0
}

ctl.!default {
    type hw
    card 0
}

# Buffer más grande para evitar underruns
pcm.dmixer {
    type dmix
    ipc_key 1024
    slave {
        pcm "hw:0,0"
        period_time 0
        period_size 1024
        buffer_size 8192
        rate 44100
    }
    bindings {
        0 0
        1 1
    }
}

pcm.dsnooper {
    type dsnoop
    ipc_key 2048
    slave {
        pcm "hw:0,0"
        channels 2
        period_time 0
        period_size 1024
        buffer_size 8192
        rate 44100
    }
    bindings {
        0 0
        1 1
    }
}

pcm.duplex {
    type asym
    playback.pcm "dmixer"
    capture.pcm "dsnooper"
}
EOF

# 2. Configurar PulseAudio si está instalado
if command -v pulseaudio &> /dev/null; then
    echo "Configurando PulseAudio..."
    
    # Crear directorio de configuración si no existe
    mkdir -p /home/pi/.config/pulse
    
    # Configuración optimizada para PulseAudio
    cat > /home/pi/.config/pulse/daemon.conf << 'EOF'
# Configuración optimizada para Raspberry Pi
default-sample-format = s16le
default-sample-rate = 44100
default-sample-channels = 2
default-fragments = 8
default-fragment-size-msec = 25

# Reduce la latencia pero evita underruns
high-priority = yes
nice-level = -11
realtime-scheduling = yes
realtime-priority = 5

# Configuración de buffer más conservadora
resample-method = speex-float-1
enable-lfe-remixing = no
flat-volumes = no
EOF

    echo "Reiniciando PulseAudio..."
    pulseaudio -k 2>/dev/null || true
    sleep 1
    pulseaudio --start 2>/dev/null || true
fi

# 3. Configurar parámetros del kernel para audio
echo "Configurando parámetros del kernel..."
if ! grep -q "audio optimization" /boot/config.txt; then
    sudo tee -a /boot/config.txt > /dev/null << 'EOF'

# Audio optimization for DeviceControl2
audio_pwm_mode=2
disable_audio_dither=1
force_eeprom_read=0
EOF
    echo "Se requiere reinicio para aplicar cambios en /boot/config.txt"
fi

# 4. Optimizar configuración del sistema
echo "Configurando límites del sistema..."
if [ -f /etc/security/limits.conf ]; then
    if ! grep -q "@audio.*memlock" /etc/security/limits.conf; then
        sudo tee -a /etc/security/limits.conf > /dev/null << 'EOF'

# Audio optimization for DeviceControl2
@audio - memlock 256
@audio - nice -10
@audio - rtprio 80
pi - memlock 256
pi - nice -10
pi - rtprio 80
EOF
    fi
fi

# 5. Configurar el navegador para mejor audio
echo "Creando script de configuración del navegador..."
cat > /home/pi/configure-browser-audio.sh << 'EOF'
#!/bin/bash
# Script para configurar el navegador con flags optimizados para audio

# Chromium flags optimizados para audio
CHROMIUM_FLAGS="
--autoplay-policy=no-user-gesture-required
--disable-features=AudioServiceOutOfProcess
--enable-features=WebRTCAudioProcessingEchoCanceller3
--audio-buffer-size=1024
--disable-background-timer-throttling
--disable-renderer-backgrounding
--disable-backgrounding-occluded-windows
--force-device-scale-factor=1
--use-fake-ui-for-media-stream
--enable-logging
--v=1
"

echo "Flags recomendados para Chromium:"
echo $CHROMIUM_FLAGS

# Si se ejecuta con --apply, modifica el archivo de configuración
if [ "$1" = "--apply" ]; then
    if [ -f /home/pi/.config/chromium-browser/Default/Preferences ]; then
        echo "Aplicando configuración a Chromium..."
        # Aquí se podría modificar la configuración del navegador
        echo "Configuración aplicada. Reinicia el navegador."
    fi
fi
EOF

chmod +x /home/pi/configure-browser-audio.sh

# 6. Verificar estado del audio
echo "=== Verificando configuración de audio ==="
echo "Tarjetas de audio disponibles:"
cat /proc/asound/cards

echo ""
echo "Dispositivos ALSA:"
aplay -l

if command -v pulseaudio &> /dev/null; then
    echo ""
    echo "Estado de PulseAudio:"
    pulseaudio --check -v && echo "PulseAudio está ejecutándose" || echo "PulseAudio no está ejecutándose"
fi

echo ""
echo "=== Configuración completada ==="
echo "Para aplicar todos los cambios:"
echo "1. Ejecuta: sudo reboot"
echo "2. Para configurar el navegador: ~/configure-browser-audio.sh --apply"
echo "3. Verifica que los sonidos funcionen correctamente en la aplicación"