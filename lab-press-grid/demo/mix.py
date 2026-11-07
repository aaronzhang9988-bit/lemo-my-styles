"""Lab Press Grid (工程套印网格) — Original 120 BPM Motorik Score + Industrial Press Foley
Reads events.json, synthesizes score (motorik kit, finger bass, saw arpeggiator, glockenspiel/marimba grid melody)
and industrial print foley (letterpress clack, steel ruler, paper slap, guillotine knife cut, redaction shutter rip,
off-grid sine glide, and hydraulic spec stamp after a half-bar silence at 21.5..22.0s) -> out/mix.wav
"""
import sys, os, json
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', r'D:\柠檬Skill\lemo-opuscar')
sys.path.insert(0, LIB)
sys.path.insert(0, os.path.join(LIB, 'core', 'audio'))

from core.audio import sampler as S
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add, limit

S.seed(2026)
rng = np.random.default_rng(2026)

out_dir = os.environ.get('OUT', os.path.join(HERE, 'out'))
ev_path = os.path.join(out_dir, 'events.json') if os.path.exists(os.path.join(out_dir, 'events.json')) else os.path.join(HERE, 'events.json')
ev = json.load(open(ev_path, 'r', encoding='utf-8')) if os.path.exists(ev_path) else {'dur': 28.0, 'ev': []}
DUR = float(ev.get('dur', 28.0)) + 0.4
N = int(DUR * SR)

E8, E16, BEAT, BAR = 0.25, 0.125, 0.5, 2.0
MIDI = [57, 59, 60, 62, 64, 66, 67]  # A Dorian: A3 B3 C4 D4 E4 F#4 G4
hz = lambda m: 440.0 * (2.0 ** ((m - 69.0) / 12.0))

# ======================================================================
# 1. SCORE (120 BPM Motorik Pulse + Marimba/Glockenspiel Grid Melody)
# ======================================================================
drums = np.zeros((N, 2), np.float64)
cym = np.zeros((N, 2), np.float64)
bass = np.zeros((N, 2), np.float64)
arp = np.zeros((N, 2), np.float64)
lead = np.zeros((N, 2), np.float64)
glk = np.zeros((N, 2), np.float64)

def kick(t, vel=0.85, g=0.95):
    add(drums, S.hit('drum_kit', 'kick_drum_left', vel), t, g, 0.0)

def snare(t, vel=0.72, g=0.78):
    add(drums, S.hit('drum_kit', 'snare_1', vel), t, g, 0.05)

def hat(t, vel=0.45, g=0.38):
    add(cym, S.hit('drum_kit', 'hi_hat_closed', vel), t, g, 0.22)

def crash(t, vel=0.8, g=0.48, pan=-0.2):
    add(cym, S.hit('drum_kit', 'crash_left', vel), t, g, pan)

def motorik_bar(t0, hats=True, full=True):
    for b in (0.0, 1.0, 1.25):
        kick(t0 + b, 0.88 if b != 1.25 else 0.72)
    if full:
        snare(t0 + 0.5)
        snare(t0 + 1.5)
    if hats:
        for i in range(8):
            hat(t0 + i * E8, 0.54 if i % 2 == 0 else 0.36, 0.38 if i % 2 == 0 else 0.28)

# Bar 1 (0..2s): Calibration ticks & intro hats
for i in range(12):
    hat(0.5 + i * E16, 0.28, 0.20)
kick(1.0, 0.85)

# Bars 2..6 (2..12s): Clause 01 & Clause 02 setup (Motorik groove)
for t0 in np.arange(2.0, 12.0, BAR):
    motorik_bar(t0, hats=True, full=(t0 >= 4.0))
crash(2.0, 0.75, 0.42)
crash(9.5, 0.82, 0.48)

# 12.0..13.0s: Half-bar build before off-grid flight
kick(12.0, 0.85)
snare(12.5, 0.75)
for i in range(4):
    hat(12.0 + i * E8, 0.45, 0.32)
# NOTE: 13.0..14.2s is the OFF-GRID FLIGHT (The Exception) -> Drums drop out completely!

# 14.2..21.5s: Landing impact at 14.2s + Re-flow & 90-degree Cost View
crash(14.2, 0.92, 0.55)
for t0 in (14.25, 16.0, 18.0, 20.0):
    if t0 < 20.0:
        motorik_bar(t0)
    else:
        # Bar 20.0..21.5s: stops hard at 21.5s for the half-bar TOTAL SILENCE before the 22.0s Hydraulic Stamp!
        kick(20.0, 0.88)
        snare(20.5, 0.72)
        kick(21.0, 0.88)
        for i in range(6):
            hat(20.0 + i * E8, 0.48, 0.34)

# 22.0..28.0s: Reprise after the 22.0s Hydraulic Spec Stamp
crash(22.0, 0.95, 0.58)
for t0 in (22.0, 24.0):
    motorik_bar(t0)
kick(26.0, 1.0, 1.05)
crash(26.0, 0.95, 0.60)

# Bass (FreePats finger bass, A1 = MIDI 33)
def bnote(t, m, d=0.22, vel=0.76, g=0.92):
    add(bass, S.note('electric_bass', m, d, vel, release=0.05), t, g, -0.05)

A1 = 33
for t0 in np.arange(2.0, 12.0, BAR):
    for i in range(8):
        bnote(t0 + i * E8, A1 + (12 if i == 7 else 0), vel=0.80 if i % 2 == 0 else 0.68)

# Soft pedal during off-grid flight (13.0..14.2s)
bnote(13.0, A1, 1.1, 0.45, 0.50)

# Melodic bass progression from 14.25 to 21.5s and 22.0 to 26.0s
BASS_SEQ = [33, 33, 36, 36, 38, 38, 40, 43]
for t0 in (14.25, 16.0, 18.0, 22.0, 24.0):
    for i, m in enumerate(BASS_SEQ):
        bnote(t0 + i * E8, m, vel=0.82 if i % 2 == 0 else 0.70)
for i in range(6):
    bnote(20.0 + i * E8, BASS_SEQ[i], vel=0.78)
bnote(26.0, A1, 1.8, 0.92, 1.1)

# Additive Saw Arpeggiator + Marimba Pluck
def saw(f, d, fc, amp=1.0):
    tt = np.arange(int(d * SR)) / SR
    y = np.zeros_like(tt)
    for k in range(1, 32):
        if k * f > 14000:
            break
        w = 1.0 / (1.0 + (k * f / fc) ** 4)
        if w < 1e-3:
            break
        y += w * np.sin(2 * np.pi * k * f * tt + rng.uniform(0, 0.2)) / k
    env = np.exp(-tt / 0.07) * np.minimum(1.0, tt / 0.003)
    if len(env) > 120:
        env[-120:] *= np.linspace(1, 0, 120)
    return y * env * amp

def marimba_pluck(m, d=0.25, amp=0.14):
    f = hz(m)
    tt = np.arange(int(d * SR)) / SR
    # Fundamental + 4x harmonic partial (classic marimba bar ratio)
    y = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.085) + 0.35 * np.sin(2 * np.pi * 4.0 * f * tt) * np.exp(-tt / 0.018)
    env = np.minimum(1.0, tt / 0.002)
    return y * env * amp

ARP_NOTES = [57, 60, 64, 69, 64, 60, 57, 62]
def arp_span(a, b, fc0, fc1, g0=0.15, g1=0.18):
    n = int(round((b - a) / E16))
    for i in range(n):
        t = a + i * E16
        if 21.45 <= t < 22.0:
            continue
        u = i / max(1, n - 1)
        m = ARP_NOTES[i % len(ARP_NOTES)]
        fc = fc0 * ((fc1 / fc0) ** u)
        add(arp, saw(hz(m), 0.18, fc, g0 + (g1 - g0) * u), t, 1.0, 0.32 if i % 2 == 0 else -0.32)
        if i % 2 == 0:
            add(lead, marimba_pluck(m + 12, 0.22, 0.11), t, 1.0, -0.20 if (i // 2) % 2 == 0 else 0.20)

arp_span(4.0, 12.8, 600, 2400, 0.13, 0.17)
arp_span(14.25, 21.4, 1800, 3000, 0.16, 0.19)
arp_span(22.0, 26.0, 2400, 3200, 0.18, 0.20)

# Glockenspiel Grid Melody Accents
MELODY = [
    (2.0, 0), (2.5, 2), (3.0, 4), (3.5, 3),
    (7.5, 5), (8.0, 4), (9.5, 6), (10.2, 4),
    (14.25, 6), (14.75, 4), (15.5, 5), (16.0, 2),
    (17.5, 4), (18.75, 6), (19.25, 5), (19.75, 4), (20.25, 2), (21.0, 6),
    (22.0, 6), (22.5, 4), (23.5, 5), (24.5, 6), (26.0, 6)
]
for t_m, col in MELODY:
    m = MIDI[col % len(MIDI)] + 24
    add(glk, S.note('glockenspiel', m, 0.9, 0.78), t_m, 0.95, 0.12)

lead += np.stack([lp(glk[:, i], 5200, 2) for i in range(2)], axis=1)
drums += np.stack([lp(cym[:, i], 7500, 1) for i in range(2)], axis=1)

mus = drums * 0.85 + bass * 0.88 + arp * 0.80 + lead * 0.85

# Enforce total silence window at 21.50..22.00s right before the Hydraulic Stamp slams!
s_sil, e_sil = int(21.48 * SR), int(22.00 * SR)
fade_len = int(0.04 * SR)
mus[s_sil:s_sil + fade_len] *= np.linspace(1.0, 0.0, fade_len)[:, None]
mus[s_sil + fade_len:e_sil] = 0.0

# ======================================================================
# 2. INDUSTRIAL PRESS FOLEY (Driven by window.EV / events.json)
# ======================================================================
def type_clack(v=1.0, big=False):
    d = 0.12 if big else 0.07
    tt = t_(d)
    p = 0.92 + rng.random() * 0.16
    x = hp(noise(d), 2500) * env_exp(d, 0.0012) * 0.9
    x += sum(a * np.sin(2 * np.pi * f * p * tt + rng.random() * 6) * env_exp(d, tau)
             for f, a, tau in [(3300, 0.45, 0.010), (5100, 0.25, 0.006), (1250, 0.35, 0.016)])
    x += np.sin(2 * np.pi * (140 if big else 420) * p * tt) * env_exp(d, 0.03 if big else 0.012) * (0.9 if big else 0.35)
    return norm(x) * v

def rule_line(v=1.0):
    d = 0.06
    return norm(bp(noise(d), 2800, 8800) * (np.sin(np.pi * t_(d) / d) ** 2)) * v

def knife_cut(d=0.20, v=1.0):
    n = noise(d)
    tt = t_(d)
    out = np.zeros_like(n)
    hop = 240
    for i in range(0, len(n), hop):
        f = 1600 + 4400 * ((i / len(n)) ** 1.5)
        seg_n = bp(n[max(0, i - 1200):i + hop], f * 0.8, min(f * 1.25, 20000))[-hop:]
        out[i:i + len(seg_n)] = seg_n
    out *= (np.minimum(1.0, tt / (d * 0.7)) ** 1.5) * np.exp(-np.maximum(0.0, tt - d * 0.8) / 0.02)
    sn = t_(0.08)
    snick = np.sin(2 * np.pi * 4200 * sn) * env_exp(0.08, 0.012) + hp(noise(0.08), 4000) * env_exp(0.08, 0.003)
    x = out * 0.75
    x[-len(sn):] += snick[:len(sn)] * 0.85
    return norm(x) * v

def redact_rip(v=1.0):
    """Sharp laser/shutter slice opening a redaction censor bar"""
    d = 0.22
    tt = t_(d)
    sweep = np.sin(2 * np.pi * (900 + 2200 * (tt / d)) * tt) * env_exp(d, 0.05) * 0.45
    shutter = bp(noise(d), 1800, 6500) * env_exp(d, 0.04) * 0.8
    click = np.sin(2 * np.pi * 2800 * tt) * env_exp(d, 0.006) * 0.7
    return norm(sweep + shutter + click) * v

def paper_slap(v=1.0):
    d = 0.25
    tt = t_(d)
    x = lp(noise(d), 900) * env_exp(d, 0.03) + np.sin(2 * np.pi * 110 * tt) * env_exp(d, 0.04) * 0.6 + hp(noise(d), 3000) * env_exp(d, 0.006) * 0.4
    return norm(x) * v

def thunk(v=1.0):
    d = 0.14
    tt = t_(d)
    return norm(np.sin(2 * np.pi * 92 * tt) * env_exp(d, 0.028) + bp(noise(d), 300, 1500) * env_exp(d, 0.007) * 0.6) * v

def block_snap(v=1.0):
    d = 0.05
    tt = t_(d)
    return norm(hp(noise(d), 1500) * env_exp(d, 0.002) + np.sin(2 * np.pi * 1900 * tt) * env_exp(d, 0.007) * 0.6 + np.sin(2 * np.pi * 620 * tt) * env_exp(d, 0.01) * 0.4) * v

def offgrid_glide(v=1.0):
    """The Exception's signature analog sine glide (13.0..14.2s, with a brief pause at 13.5..13.7s)"""
    d = 1.2
    tt = np.arange(int(d * SR)) / SR + 13.0
    m = np.interp(tt, [13.0, 13.5, 13.7, 14.2], [76, 71, 71, 64])
    ph = 2 * np.pi * np.cumsum(hz(m)) / SR
    y = np.sin(ph) + 0.18 * np.sin(2 * ph)
    env = np.minimum(1.0, (tt - 13.0) / 0.03) * np.minimum(1.0, (14.2 - tt) / 0.02)
    return norm(y * env) * v

def thump_land(v=1.0):
    d = 0.42
    tt = t_(d)
    return norm(np.sin(2 * np.pi * 58 * tt * (1 - 0.25 * tt)) * env_exp(d, 0.09) + lp(noise(d), 250) * env_exp(d, 0.02) * 0.45) * v

def hydraulic_stamp(v=1.0):
    """Heavy 55 Hz hydraulic press thud + metallic latch click + paper crunch at t=22.0s"""
    d = 0.55
    tt = t_(d)
    sub = np.sin(2 * np.pi * (62 * np.exp(-tt * 3.2) + 42) * tt) * env_exp(d, 0.11) * 1.1
    metal = (np.sin(2 * np.pi * 2400 * tt) * env_exp(d, 0.008) + np.sin(2 * np.pi * 4100 * tt) * env_exp(d, 0.005)) * 0.65
    crunch = bp(noise(d), 400, 3800) * env_exp(d, 0.025) * 0.75
    return norm(sub + metal + crunch) * v

FOLEY = {
    'clack': (lambda e: type_clack(), 0.22),
    'rule': (lambda e: rule_line(), 0.12),
    'paper': (lambda e: paper_slap(), 0.34),
    'thunk': (lambda e: thunk(), 0.28),
    'snap': (lambda e: block_snap(), 0.16),
    'knife': (lambda e: knife_cut(0.20), 0.32),
    'redact': (lambda e: redact_rip(), 0.30),
    'glide': (lambda e: offgrid_glide(), 0.26),
    'thump': (lambda e: thump_land(), 0.48),
    'reflow': (lambda e: type_clack(big=True), 0.26),
    'stamp': (lambda e: hydraulic_stamp(), 0.68),
}

fol = np.zeros((N, 2), np.float64)
for e in ev.get('ev', []):
    tp = e.get('type')
    if tp not in FOLEY:
        continue
    fn, gain = FOLEY[tp]
    x = fn(e).astype(np.float64)
    at = float(e['t'])
    if tp == 'knife':
        at = max(0.0, at - 0.14)
    pan = 0.0 if tp in ('stamp', 'thump', 'glide') else float(rng.uniform(-0.22, 0.22))
    add(fol, x, at, gain, pan=pan)

# Combine music & foley, limit cleanly, and write out/mix.wav
mix = mus * 0.78 + fol * 0.95
peak = np.abs(mix).max()
if peak > 1e-6:
    mix = mix * (0.88 / peak)
for c in range(2):
    mix[:, c] = limit(mix[:, c], 0.92)

out_dir = os.environ.get('OUT', os.path.join(HERE, 'out'))
os.makedirs(out_dir, exist_ok=True)
out_wav = os.path.join(out_dir, 'mix.wav')
sf.write(out_wav, mix.astype(np.float32), SR, subtype='FLOAT')

def db(x):
    return 20.0 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)

print(f'Wrote {out_wav} | peak: {20*np.log10(np.abs(mix).max()):.2f} dBFS | RMS: {db(mix):.2f} dBFS | silence(21.55-21.95s): {db(mix[int(21.55*SR):int(21.95*SR)]):.1f} dBFS')
