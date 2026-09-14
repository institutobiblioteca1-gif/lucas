import type { TeachingPlan, Discipline, ClassYear, ClassEntity, Course, Professor } from './types';

interface PlanData {
  plan: TeachingPlan;
  discipline: Discipline;
  classYear: ClassYear;
  classEntity: ClassEntity;
  course: Course;
  professor: Professor | null;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textToParagraphs(text: string, fontSize = '22'): string {
  if (!text || !text.trim()) {
    return `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr></w:pPr></w:p>`;
  }
  return text.split('\n').map((line) =>
    `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="${fontSize}"/><w:szCs w:val="${fontSize}"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
  ).join('');
}

function sectionHeader(text: string): string {
  return `<w:p><w:pPr><w:spacing w:line="276" w:lineRule="auto"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function tableRow(label: string, value: string): string {
  return `<w:tr><w:tc><w:tcPr><w:tcW w:w="2808" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(label)}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="6552" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p></w:tc></w:tr>`;
}

export function generateDocxXml(data: PlanData): string {
  const { plan, discipline, classYear, course, professor } = data;
  const anoSemestre = `${classYear.year}/${classYear.semester}º`;
  const chCreditos = `${discipline.workload_hours}h / ${discipline.credits} créditos`;
  const codNome = `${discipline.code} — ${discipline.name}`;
  const profName = professor?.name || '—';

  const identificationTable = `<w:tbl>
<w:tblPr>
<w:tblW w:w="9360" w:type="dxa"/>
<w:tblBorders>
<w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/>
<w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/>
<w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/>
<w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/>
<w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/>
<w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/>
</w:tblBorders>
</w:tblPr>
<w:tblGrid>
<w:gridCol w:w="2808"/><w:gridCol w:w="6552"/>
</w:tblGrid>
${tableRow('Curso:', course.name)}
${tableRow('Ano/Semestre:', anoSemestre)}
${tableRow('Código/Nome da disciplina:', codNome)}
${tableRow('CH/Créditos:', chCreditos)}
${tableRow('Professor Responsável:', profName)}
</w:tbl>`;

  const body = `${identificationTable}
<w:p/>
${sectionHeader('Ementa:')}
${textToParagraphs(plan.ementa, '22')}
<w:p/>
${sectionHeader('COMPETÊNCIAS:')}
${textToParagraphs(plan.competencias, '22')}
<w:p/>
${sectionHeader('Conteúdo:')}
${textToParagraphs(plan.conteudo, '22')}
<w:p/>
${sectionHeader('Bibliografia Básica:')}
${textToParagraphs(plan.bibliografia_basica, '22')}
<w:p/>
${sectionHeader('Bibliografia Complementar:')}
${textToParagraphs(plan.bibliografia_complementar, '22')}
<w:p/>
${sectionHeader('Bibliografia de Aprofundamento:')}
${textToParagraphs(plan.bibliografia_aprofundamento, '22')}`;

  const headerParagraphs = `<w:p>
<w:pPr><w:ind w:left="142"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>
<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>INSTITUTO ARQUIDIOCESANO DE FILOSOFIA E TEOLOGIA SÃO JOÃO PAULO II</w:t></w:r>
</w:p>
<w:p>
<w:pPr><w:ind w:left="142"/><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>
<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>Plano de Ensino</w:t></w:r>
</w:p>
<w:p/>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>
${headerParagraphs}
${body}
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
</w:body>
</w:document>`;
}

const CRC_TABLE: number[] = (() => {
  const table = new Array<number>(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  nameBytes: Uint8Array;
  contentBytes: Uint8Array;
  crc: number;
  localOffset: number;
}

/**
 * Builds a real ZIP archive (uncompressed / STORE method) with no external
 * dependency, into a single contiguous buffer. A .docx file is just a ZIP
 * archive of XML parts, so this is enough to produce a genuine, Word-native
 * document instead of an HTML file disguised as .doc (which Word renders
 * very inconsistently).
 */
function createZipBlob(files: Record<string, string>, mimeType: string): Blob {
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const contentBytes = encoder.encode(content);
    entries.push({ nameBytes, contentBytes, crc: crc32(contentBytes), localOffset: offset });
    offset += 30 + nameBytes.length + contentBytes.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const e of entries) centralDirSize += 46 + e.nameBytes.length;

  const out = new Uint8Array(centralDirOffset + centralDirSize + 22);
  const view = new DataView(out.buffer);

  let pos = 0;
  for (const e of entries) {
    view.setUint32(pos, 0x04034b50, true);
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, 0, true);
    view.setUint16(pos + 8, 0, true);
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, 0x21, true);
    view.setUint32(pos + 14, e.crc, true);
    view.setUint32(pos + 18, e.contentBytes.length, true);
    view.setUint32(pos + 22, e.contentBytes.length, true);
    view.setUint16(pos + 26, e.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true);
    out.set(e.nameBytes, pos + 30);
    out.set(e.contentBytes, pos + 30 + e.nameBytes.length);
    pos += 30 + e.nameBytes.length + e.contentBytes.length;
  }

  for (const e of entries) {
    view.setUint32(pos, 0x02014b50, true);
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, 20, true);
    view.setUint16(pos + 8, 0, true);
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, 0, true);
    view.setUint16(pos + 14, 0x21, true);
    view.setUint32(pos + 16, e.crc, true);
    view.setUint32(pos + 20, e.contentBytes.length, true);
    view.setUint32(pos + 24, e.contentBytes.length, true);
    view.setUint16(pos + 28, e.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true);
    view.setUint16(pos + 32, 0, true);
    view.setUint16(pos + 34, 0, true);
    view.setUint16(pos + 36, 0, true);
    view.setUint32(pos + 38, 0, true);
    view.setUint32(pos + 42, e.localOffset, true);
    out.set(e.nameBytes, pos + 46);
    pos += 46 + e.nameBytes.length;
  }

  view.setUint32(pos, 0x06054b50, true);
  view.setUint16(pos + 4, 0, true);
  view.setUint16(pos + 6, 0, true);
  view.setUint16(pos + 8, entries.length, true);
  view.setUint16(pos + 10, entries.length, true);
  view.setUint32(pos + 12, centralDirSize, true);
  view.setUint32(pos + 16, centralDirOffset, true);
  view.setUint16(pos + 20, 0, true);

  return new Blob([out], { type: mimeType });
}

export function downloadDocx(data: PlanData) {
  const documentXml = generateDocxXml(data);

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'word/document.xml': documentXml,
    'word/_rels/document.xml.rels': docRels,
  };

  const blob = createZipBlob(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plano_${data.discipline.code}_${data.classYear.year}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
