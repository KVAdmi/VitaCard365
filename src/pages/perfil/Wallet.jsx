import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Lock, Save, Plus, Trash2 } from 'lucide-react';

// Cifrado local simple (Web Crypto). Los datos NO se suben a servidor.
async function deriveKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('vita-wallet-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJson(password, data) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const out = new Uint8Array(iv.byteLength + cipher.byteLength);
  out.set(iv, 0); out.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...out));
}

async function decryptJson(password, b64) {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const key = await deriveKey(password);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return JSON.parse(new TextDecoder().decode(new Uint8Array(plain)));
}

const STORAGE_KEY = 'vita_wallet_secure_v2';

export default function Wallet() {
  const [locked, setLocked] = useState(true);
  const [pass, setPass] = useState('');
  const [data, setData] = useState({
    policies: [], // {company, policyNumber, validTo, lastPaymentDate, beneficiaries, emergencyPhones, notes}
    cards: [], // {bank, last4, phone, notes}
    emergencyContacts: [], // {name, relationship, phone}
    keyDocuments: [], // {docType, idNumber, issuer, expirationDate, notes}
    notes: [] // {text}
  });
  const neonNotice = 'Tu información está cifrada localmente y no se almacena en servidores. Solo tú puedes acceder con tu contraseña.';

  useEffect(() => {
    // nada al montar
  }, []);

  const migrateLegacyIfNeeded = (maybeLegacy) => {
    // v1 era un objeto con strings: {seguros, tarjetas, contactos, documentos, notas}
    if (
      maybeLegacy &&
      typeof maybeLegacy === 'object' &&
      ('seguros' in maybeLegacy || 'tarjetas' in maybeLegacy || 'contactos' in maybeLegacy || 'documentos' in maybeLegacy)
    ) {
      const migrated = {
        policies: maybeLegacy.seguros ? [{ company: '', policyNumber: maybeLegacy.seguros, validTo: '', lastPaymentDate: '', beneficiaries: '', emergencyPhones: '', notes: '' }] : [],
        cards: maybeLegacy.tarjetas ? [{ bank: '', last4: maybeLegacy.tarjetas, phone: '', notes: '' }] : [],
        emergencyContacts: maybeLegacy.contactos ? [{ name: maybeLegacy.contactos, relationship: '', phone: '' }] : [],
        keyDocuments: maybeLegacy.documentos ? [{ docType: 'Documento', idNumber: maybeLegacy.documentos, issuer: '', expirationDate: '', notes: '' }] : [],
        notes: maybeLegacy.notas ? [{ text: maybeLegacy.notas }] : []
      };
      return migrated;
    }
    return maybeLegacy;
  };

  const onUnlock = async () => {
    try {
      // intentamos v2
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const decrypted = await decryptJson(pass, saved);
        setData(migrateLegacyIfNeeded(decrypted) || { policies: [], cards: [], emergencyContacts: [], keyDocuments: [], notes: [] });
      } else {
        // Intentar leer v1 y migrar si existe
        const legacy = localStorage.getItem('vita_wallet_secure_v1');
        if (legacy) {
          const legacyObj = await decryptJson(pass, legacy);
          setData(migrateLegacyIfNeeded(legacyObj) || { policies: [], cards: [], emergencyContacts: [], keyDocuments: [], notes: [] });
        }
      }
      setLocked(false);
    } catch (e) {
      alert('Contraseña incorrecta o datos corruptos.');
    }
  };

  const onSave = async () => {
    try {
      const b64 = await encryptJson(pass, data);
      localStorage.setItem(STORAGE_KEY, b64);
      alert('Datos guardados localmente (cifrados).');
    } catch (e) {
      alert('No se pudo guardar.');
    }
  };

  // Helpers CRUD por sección
  const addPolicy = (item) => setData((d) => ({ ...d, policies: [...d.policies, item] }));
  const removePolicy = (idx) => setData((d) => ({ ...d, policies: d.policies.filter((_, i) => i !== idx) }));
  const addCard = (item) => setData((d) => ({ ...d, cards: [...d.cards, item] }));
  const removeCard = (idx) => setData((d) => ({ ...d, cards: d.cards.filter((_, i) => i !== idx) }));
  const addContact = (item) => setData((d) => ({ ...d, emergencyContacts: [...d.emergencyContacts, item] }));
  const removeContact = (idx) => setData((d) => ({ ...d, emergencyContacts: d.emergencyContacts.filter((_, i) => i !== idx) }));
  const addDoc = (item) => setData((d) => ({ ...d, keyDocuments: [...d.keyDocuments, item] }));
  const removeDoc = (idx) => setData((d) => ({ ...d, keyDocuments: d.keyDocuments.filter((_, i) => i !== idx) }));
  const addNote = (text) => setData((d) => ({ ...d, notes: [...d.notes, { text }] }));
  const removeNote = (idx) => setData((d) => ({ ...d, notes: d.notes.filter((_, i) => i !== idx) }));

  return (
    <>
      <Helmet>
        <title>Wallet segura</title>
      </Helmet>
      <Layout title="Wallet segura" showBackButton>
        <div className="p-4 space-y-4">
          <Card className="glass-card border border-vita-orange/40">
            <CardHeader>
              <CardTitle className="text-vita-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-vita-orange" /> Acceso protegido
              </CardTitle>
              <CardDescription className="text-white/80">{neonNotice}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {locked ? (
                <div className="space-y-2">
                  <Label>Contraseña de tu inicio de sesión</Label>
                  <Input type="password" value={pass} onChange={(e)=>setPass(e.target.value)} placeholder="Ingresa tu contraseña" />
                  <Button onClick={onUnlock} disabled={!pass}>Desbloquear</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Accordion type="multiple" className="w-full">
                    {/* Pólizas */}
                    <AccordionItem value="polizas">
                      <AccordionTrigger className="text-vita-white">Pólizas y Seguros</AccordionTrigger>
                      <AccordionContent>
                        <Card className="glass-card border border-white/10">
                          <CardContent className="p-4 space-y-3">
                            <PolicyForm onAdd={addPolicy} />
                            <ListPolicies items={data.policies} onRemove={removePolicy} />
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Tarjetas */}
                    <AccordionItem value="tarjetas">
                      <AccordionTrigger className="text-vita-white">Tarjetas (banco)</AccordionTrigger>
                      <AccordionContent>
                        <Card className="glass-card border border-white/10">
                          <CardContent className="p-4 space-y-3">
                            <CardForm onAdd={addCard} />
                            <ListCards items={data.cards} onRemove={removeCard} />
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Contactos de emergencia */}
                    <AccordionItem value="contactos">
                      <AccordionTrigger className="text-vita-white">Contactos de Emergencia</AccordionTrigger>
                      <AccordionContent>
                        <Card className="glass-card border border-white/10">
                          <CardContent className="p-4 space-y-3">
                            <ContactForm onAdd={addContact} />
                            <ListContacts items={data.emergencyContacts} onRemove={removeContact} />
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Documentos clave */}
                    <AccordionItem value="docs">
                      <AccordionTrigger className="text-vita-white">Documentos clave</AccordionTrigger>
                      <AccordionContent>
                        <Card className="glass-card border border-white/10">
                          <CardContent className="p-4 space-y-3">
                            <DocForm onAdd={addDoc} />
                            <ListDocs items={data.keyDocuments} onRemove={removeDoc} />
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Notas */}
                    <AccordionItem value="notas">
                      <AccordionTrigger className="text-vita-white">Notas rápidas</AccordionTrigger>
                      <AccordionContent>
                        <Card className="glass-card border border-white/10">
                          <CardContent className="p-4 space-y-3">
                            <NotesForm onAdd={addNote} />
                            <ListNotes items={data.notes} onRemove={removeNote} />
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="pt-2">
                    <Button onClick={onSave} className="w-full"><Save className="h-4 w-4 mr-2"/>Guardar todo</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </>
  );
}

// Formularios y listas por sección
function SectionTitle({ children }){
  return <h4 className="text-white font-semibold">{children}</h4>;
}

function PolicyForm({ onAdd }){
  const [form, setForm] = useState({ company:'', policyNumber:'', validTo:'', lastPaymentDate:'', beneficiaries:'', emergencyPhones:'', notes:'' });
  const canAdd = form.company && form.policyNumber;
  return (
    <div className="space-y-2">
      <SectionTitle>Nueva póliza</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="Compañía" value={form.company} onChange={(e)=>setForm({...form, company:e.target.value})} />
        <Input placeholder="No. de póliza" value={form.policyNumber} onChange={(e)=>setForm({...form, policyNumber:e.target.value})} />
        <Input placeholder="Vigencia hasta (AAAA-MM-DD)" value={form.validTo} onChange={(e)=>setForm({...form, validTo:e.target.value})} />
        <Input placeholder="Último pago (AAAA-MM-DD)" value={form.lastPaymentDate} onChange={(e)=>setForm({...form, lastPaymentDate:e.target.value})} />
        <Input placeholder="Beneficiarios" value={form.beneficiaries} onChange={(e)=>setForm({...form, beneficiaries:e.target.value})} />
        <Input placeholder="Teléfonos de emergencia" value={form.emergencyPhones} onChange={(e)=>setForm({...form, emergencyPhones:e.target.value})} />
      </div>
      <Input placeholder="Notas" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
      <Button size="sm" disabled={!canAdd} onClick={()=>{ onAdd(form); setForm({ company:'', policyNumber:'', validTo:'', lastPaymentDate:'', beneficiaries:'', emergencyPhones:'', notes:'' }); }}>
        <Plus className="h-4 w-4 mr-2"/>Agregar póliza
      </Button>
    </div>
  );
}

function ListPolicies({ items, onRemove }){
  if (!items?.length) return <p className="text-white/60 text-sm">Sin pólizas guardadas.</p>;
  return (
    <div className="space-y-2">
      {items.map((p, idx)=> (
        <Card key={idx} className="bg-white/5 border border-white/10">
          <CardContent className="p-3 text-sm text-white/90 flex justify-between gap-2">
            <div>
              <div className="font-semibold">{p.company} — {p.policyNumber}</div>
              <div className="text-white/70">Vigente hasta: {p.validTo || '—'} | Último pago: {p.lastPaymentDate || '—'}</div>
              <div className="text-white/70">Beneficiarios: {p.beneficiaries || '—'}</div>
              <div className="text-white/70">Tel. emergencia: {p.emergencyPhones || '—'}</div>
              {p.notes && <div className="text-white/70">Notas: {p.notes}</div>}
            </div>
            <Button size="icon" variant="destructive" onClick={()=>onRemove(idx)} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CardForm({ onAdd }){
  const [form, setForm] = useState({ bank:'', last4:'', phone:'', notes:'' });
  const canAdd = form.bank && form.last4;
  return (
    <div className="space-y-2">
      <SectionTitle>Nueva tarjeta</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input placeholder="Banco" value={form.bank} onChange={(e)=>setForm({...form, bank:e.target.value})} />
        <Input placeholder="Últimos 4" value={form.last4} onChange={(e)=>setForm({...form, last4:e.target.value})} />
        <Input placeholder="Tel. atención a clientes" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
      </div>
      <Input placeholder="Notas" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
      <Button size="sm" disabled={!canAdd} onClick={()=>{ onAdd(form); setForm({ bank:'', last4:'', phone:'', notes:'' }); }}>
        <Plus className="h-4 w-4 mr-2"/>Agregar tarjeta
      </Button>
    </div>
  );
}

function ListCards({ items, onRemove }){
  if (!items?.length) return <p className="text-white/60 text-sm">Sin tarjetas guardadas.</p>;
  return (
    <div className="space-y-2">
      {items.map((c, idx)=> (
        <Card key={idx} className="bg-white/5 border border-white/10">
          <CardContent className="p-3 text-sm text-white/90 flex justify-between gap-2">
            <div>
              <div className="font-semibold">{c.bank} — **** {c.last4}</div>
              <div className="text-white/70">Atención: {c.phone || '—'}</div>
              {c.notes && <div className="text-white/70">Notas: {c.notes}</div>}
            </div>
            <Button size="icon" variant="destructive" onClick={()=>onRemove(idx)} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ContactForm({ onAdd }){
  const [form, setForm] = useState({ name:'', relationship:'', phone:'' });
  const canAdd = form.name && form.phone;
  return (
    <div className="space-y-2">
      <SectionTitle>Nuevo contacto</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input placeholder="Nombre" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
        <Input placeholder="Relación" value={form.relationship} onChange={(e)=>setForm({...form, relationship:e.target.value})} />
        <Input placeholder="Teléfono" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
      </div>
      <Button size="sm" disabled={!canAdd} onClick={()=>{ onAdd(form); setForm({ name:'', relationship:'', phone:'' }); }}>
        <Plus className="h-4 w-4 mr-2"/>Agregar contacto
      </Button>
    </div>
  );
}

function ListContacts({ items, onRemove }){
  if (!items?.length) return <p className="text-white/60 text-sm">Sin contactos guardados.</p>;
  return (
    <div className="space-y-2">
      {items.map((c, idx)=> (
        <Card key={idx} className="bg-white/5 border border-white/10">
          <CardContent className="p-3 text-sm text-white/90 flex justify-between gap-2">
            <div>
              <div className="font-semibold">{c.name} {c.relationship ? `(${c.relationship})` : ''}</div>
              <div className="text-white/70">Tel: {c.phone}</div>
            </div>
            <Button size="icon" variant="destructive" onClick={()=>onRemove(idx)} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DocForm({ onAdd }){
  const [form, setForm] = useState({ docType:'', idNumber:'', issuer:'', expirationDate:'', notes:'' });
  const canAdd = form.docType && form.idNumber;
  return (
    <div className="space-y-2">
      <SectionTitle>Nuevo documento</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="Tipo (CURP, Pasaporte, etc.)" value={form.docType} onChange={(e)=>setForm({...form, docType:e.target.value})} />
        <Input placeholder="Número/ID" value={form.idNumber} onChange={(e)=>setForm({...form, idNumber:e.target.value})} />
        <Input placeholder="Emisor (Secretaría, País)" value={form.issuer} onChange={(e)=>setForm({...form, issuer:e.target.value})} />
        <Input placeholder="Vencimiento (AAAA-MM-DD)" value={form.expirationDate} onChange={(e)=>setForm({...form, expirationDate:e.target.value})} />
      </div>
      <Input placeholder="Notas" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
      <Button size="sm" disabled={!canAdd} onClick={()=>{ onAdd(form); setForm({ docType:'', idNumber:'', issuer:'', expirationDate:'', notes:'' }); }}>
        <Plus className="h-4 w-4 mr-2"/>Agregar documento
      </Button>
    </div>
  );
}

function ListDocs({ items, onRemove }){
  if (!items?.length) return <p className="text-white/60 text-sm">Sin documentos guardados.</p>;
  return (
    <div className="space-y-2">
      {items.map((d, idx)=> (
        <Card key={idx} className="bg-white/5 border border-white/10">
          <CardContent className="p-3 text-sm text-white/90 flex justify-between gap-2">
            <div>
              <div className="font-semibold">{d.docType} — {d.idNumber}</div>
              <div className="text-white/70">Emisor: {d.issuer || '—'} | Vence: {d.expirationDate || '—'}</div>
              {d.notes && <div className="text-white/70">Notas: {d.notes}</div>}
            </div>
            <Button size="icon" variant="destructive" onClick={()=>onRemove(idx)} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function NotesForm({ onAdd }){
  const [text, setText] = useState('');
  return (
    <div className="space-y-2">
      <SectionTitle>Nueva nota</SectionTitle>
      <Input placeholder="Texto de la nota" value={text} onChange={(e)=>setText(e.target.value)} />
      <Button size="sm" disabled={!text} onClick={()=>{ onAdd(text); setText(''); }}>
        <Plus className="h-4 w-4 mr-2"/>Agregar nota
      </Button>
    </div>
  );
}

function ListNotes({ items, onRemove }){
  if (!items?.length) return <p className="text-white/60 text-sm">Sin notas guardadas.</p>;
  return (
    <div className="space-y-2">
      {items.map((n, idx)=> (
        <Card key={idx} className="bg-white/5 border border-white/10">
          <CardContent className="p-3 text-sm text-white/90 flex justify-between gap-2">
            <div>{n.text}</div>
            <Button size="icon" variant="destructive" onClick={()=>onRemove(idx)} title="Eliminar">
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
