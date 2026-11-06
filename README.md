# SSAI Tanıtım Videosu

Dikey (1080×1920), ~94 sn SSAI ürün tanıtım videosu. Her ürünü 3D robot seslendirir.
Açılış/kapanış: "SSAI — Şirketinizin iş yapma süreçlerini değiştiriyoruz. www.safineai.com"

[OpenMontage](https://github.com/calesthio/OpenMontage) ortamında üretildi (Remotion + Three.js).

## Yapı
- `audio-pipeline/script.json` — sahne metinleri ve seslendirme metinleri
- `audio-pipeline/tts.py` — çevrimdışı Türkçe TTS (espeak-ng) + robot ses efekti
- `audio-pipeline/build_audio.py` — zaman çizelgesi, ağız animasyonu zarfı, müzik ve miks
- `remotion/src/ssai/` — 3D robot, sahne objeleri ve kompozisyon

## Çalıştırma (OpenMontage içinde)
1. `remotion/src/ssai/` klasörünü `remotion-composer/src/ssai/` altına kopyalayın, `npm i @remotion/three three @react-three/fiber@8`.
2. `python audio-pipeline/tts.py && python audio-pipeline/build_audio.py`, oluşan `timeline.json`'u `src/ssai/` içine kopyalayın.
3. `npx remotion render src/ssai/index.tsx SsaiPromo out.mp4 --gl=swangle`
4. Sesi birleştirin: `ffmpeg -i out.mp4 -i audio/mix.wav -c:v copy -c:a aac -shortest final.mp4`
