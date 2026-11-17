// Runnable: `npx tsx src/agent/mg-code-tools.check.ts`
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { makeDraft } from '../../editor/store';
import { docFromTimeline } from '../../persist/projectStore';
import { prepareTemplate } from '../../template-host';
import type { AgentContext } from '../context';
import { execMgCodeTool, MG_CODE_TOOL_NAMES } from './mg-code-tools';

assert.ok(MG_CODE_TOOL_NAMES.has('create_motion_graphic_from_code'));

const draft = makeDraft(docFromTimeline({
  fps: 30, width: 1920, height: 1080, items: [], selectedId: null, assets: [],
}));
const ctx: AgentContext = {
  commands: draft.commands,
  getState: draft.getState,
  getDoc: draft.getDoc,
  getCreativeMode: () => null,
  templates: [],
  audio: [],
};

const bad = await execMgCodeTool('create_motion_graphic_from_code', {
  code: 'import fs from "fs"',
  name: 'x',
  width: 100,
  height: 100,
}, ctx) as { error?: string };
assert.ok(bad.error);

const code = `const Title = ({item}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{color:'#fff'}}>{frame}</AbsoluteFill>;
};`;
const ok = await execMgCodeTool('create_motion_graphic_from_code', {
  code,
  name: 'Beat Card',
  width: 1080,
  height: 1920,
  durationInSeconds: 2,
  properties: [{ key: 'title', defaultValue: 'Hello' }],
}, ctx) as { ok: boolean; assetId: string; durationInFrames: number };
assert.strictEqual(ok.ok, true);
assert.strictEqual(ok.durationInFrames, 60);
const asset = draft.getDoc().assets.find((a) => a.id === ok.assetId);
assert.ok(asset);
assert.strictEqual(asset!.kind, 'motion-graphic');
assert.strictEqual(asset!.props?.title, 'Hello');

// Verify AST & prototype-chain sandbox escape hardening
for (const escapeCode of [
  'const X = ({item}) => { const f = ({})["con" + "structor"]; return null; };',
  'const X = ({item}) => { const f = ({})["constructor"]; return null; };',
  'const X = ({item}) => { const f = Object.getPrototypeOf({}); return null; };',
  'const X = ({item}) => { const f = Reflect.get({}, "toString"); return null; };',
  'const X = ({item}) => { const f = ({}).__proto__; return null; };',
  'const X = ({item}) => { return <div>{this}</div>; };',
]) {
  const escaped = await execMgCodeTool('create_motion_graphic_from_code', {
    code: escapeCode,
    name: 'Escape Attempt',
    width: 100,
    height: 100,
  }, ctx) as { error?: string };
  assert.ok(escaped.error, `Expected sandbox rejection for: ${escapeCode}`);
}

const builtinTemplates = JSON.parse(
  readFileSync(new URL('../../../assets/templates/openchatcut-templates.json', import.meta.url), 'utf8'),
) as Array<{ id: string; name: string; code: string }>;
for (const tmpl of builtinTemplates) {
  await prepareTemplate(tmpl.code);
}

console.log('mg-code-tools.check: ok');
