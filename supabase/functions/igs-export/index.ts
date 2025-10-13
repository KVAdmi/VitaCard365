// @ts-nocheck
// Deno Deploy / Supabase Edge Function: igs-export
// GET -> returns CSV generated from public.v_igs_layout ordered by Consecutivo asc

// CSV headers in the required order (we will map from compact DB fields to these labels)
const HEADERS: string[] = [
  'Consecutivo',
  'Folio VitaCard',
  'Nombre',
  'Apellido Paterno',
  'Apellido Materno',
  'Fecha de Nacimiento DD/MM/AAA',
  'Sexo',
  'TIPO DE BENEFICIARIO',
  'Estado',
  'Fecha de inicio pago',
  'Fin de vigencia (se pone la fecha del prox pago)',
  'Telefono',
];

function toCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  // Escape quotes and wrap in quotes if needed
  const needsQuotes = /[",\n\r]/.test(s) || s.includes(',');
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function buildCsv(rows: Record<string, unknown>[]): string {
  const headerLine = HEADERS.join(',');
  const lines = rows.map((row) => HEADERS.map((key) => toCsvValue((row as any)[key])).join(','));
  return [headerLine, ...lines].join('\n');
}

function todayFileName(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `IGS_${y}${m}${d}.csv`;
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function fmtDDMMYYYY(input: string | null | undefined): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(+d)) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = d.getUTCFullYear();
  return `${dd}/${mm}/${yy}`;
}

function addMonths(d: Date, months: number): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date;
}

function nextByPeriod(start: string | null | undefined, period: string | null | undefined): string {
  if (!start) return '';
  const d = new Date(start);
  if (isNaN(+d)) return '';
  const p = (period || '').toLowerCase();
  let out: Date = d;
  if (p === 'mensual') out = addMonths(d, 1);
  else if (p === 'trimestral') out = addMonths(d, 3);
  else if (p === 'anual') out = addMonths(d, 12);
  // otro/null → inicio
  else out = d;
  return fmtDDMMYYYY(out.toISOString());
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return new Response('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY', { status: 500 });
  }

  // Compact select to avoid relying on header names with spaces.
  // NOTE: telefono is the column name in the view; alias it to phone for internal mapping.
  const select = 'user_id,folio_vita,nombres,apellido_paterno,apellido_materno,fecha_nacimiento,sexo,acceso_activo,pagado_desde,pagado_hasta,periodicidad,phone:telefono';
  const url = `${SUPABASE_URL}/rest/v1/v_igs_layout?select=${encodeURIComponent(select)}&order=folio_vita.asc&order=user_id.asc`;
  const resp = await fetch(url, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    const body = await resp.text();
    return new Response(`Upstream error: ${resp.status} ${body}`, { status: 502 });
  }

  const dbRows = (await resp.json()) as any[];
  // Map rows to the exact header schema
  const mapped = (dbRows || []).map((r, idx) => {
    const consecutivo = idx + 1;
    const folio = r.folio_vita ?? '';
    const nombre = r.nombres ?? '';
    const apPaterno = r.apellido_paterno ?? '';
    const apMaterno = r.apellido_materno ?? '';
    const fnac = fmtDDMMYYYY(r.fecha_nacimiento);
    const sexo = String(r.sexo ?? 'NO ESPECIFICADO').toUpperCase();
    const tipoBenef = 'TITULAR';
    const estado = r.acceso_activo ? 'Activo' : 'Inactivo';
    const inicio = fmtDDMMYYYY(r.pagado_desde);
    const fin = fmtDDMMYYYY(r.pagado_hasta) || nextByPeriod(r.pagado_desde, r.periodicidad);
    const telefono = r.phone ?? '';

    return {
      'Consecutivo': consecutivo,
      'Folio VitaCard': folio,
      'Nombre': nombre,
      'Apellido Paterno': apPaterno,
      'Apellido Materno': apMaterno,
      'Fecha de Nacimiento DD/MM/AAA': fnac,
      'Sexo': sexo,
      'TIPO DE BENEFICIARIO': tipoBenef,
      'Estado': estado,
      'Fecha de inicio pago': inicio,
      'Fin de vigencia (se pone la fecha del prox pago)': fin,
      'Telefono': telefono,
    } as Record<string, unknown>;
  });

  const csv = buildCsv(mapped);

  // Return CSV with filename hint
  const fileName = todayFileName();
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
});
