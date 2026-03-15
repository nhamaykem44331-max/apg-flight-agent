import { spawn } from 'child_process';
import path from 'path';

export interface FlyClawInput {
  from: string;
  to: string;
  date: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabin: 'economy' | 'premium' | 'business' | 'first';
}

function extractJsonArray(text: string) {
  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  if (s === -1 || e === -1 || e <= s) return [];
  return JSON.parse(text.slice(s, e + 1));
}

function runWith(cmd: string, args: string[], cwd: string) {
  return new Promise<any[]>((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    let out = '';
    let err = '';
    const t = setTimeout(() => {
      p.kill('SIGTERM');
      reject(new Error('FlyClaw timeout (45s)'));
    }, 45000);

    p.stdout.on('data', d => (out += d.toString()));
    p.stderr.on('data', d => (err += d.toString()));

    p.on('error', e => {
      clearTimeout(t);
      reject(e);
    });

    p.on('close', code => {
      clearTimeout(t);
      if (code !== 0) {
        reject(new Error((err || out || `exit ${code}`).trim()));
      } else {
        try {
          resolve(extractJsonArray(out));
        } catch (e: any) {
          reject(new Error(`Parse FlyClaw JSON lỗi: ${e.message}`));
        }
      }
    });
  });
}

export async function runFlyClaw(input: FlyClawInput) {
  const cwd = path.join(process.cwd(), 'flyclaw');
  const args = [
    'flyclaw.py', 'search',
    '--from', input.from,
    '--to', input.to,
    '--date', input.date,
    '--cabin', input.cabin,
    '-a', String(input.adults),
    '--children', String(input.children),
    '--infants', String(input.infants),
    '--stops', 'any',
    '-o', 'json'
  ];

  if (input.returnDate) {
    args.push('--return', input.returnDate);
  }

  const candidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python', 'py'];
  let lastErr: any;
  for (const c of candidates) {
    try {
      return await runWith(c, args, cwd);
    } catch (e) {
      lastErr = e;
    }
  }

  throw new Error(lastErr?.message || 'Không chạy được FlyClaw');
}
