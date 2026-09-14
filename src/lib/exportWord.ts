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

function tableCell(label: string, value: string, isLabel = true, colSpan = 1): string {
  const rPr = isLabel
    ? `<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/>`
    : `<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/>`;
  const gridSpan = colSpan > 1 ? `<w:gridSpan w:val="${colSpan}"/>` : '';
  return `<w:tc><w:tcPr><w:tcW w:w="${isLabel ? '2690' : '2981'}" w:type="dxa"/>${gridSpan}</w:tcPr><w:p><w:pPr><w:jc w:val="both"/><w:rPr>${rPr}</w:rPr></w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(label)}${isLabel ? '' : escapeXml(value)}</w:t></w:r></w:p></w:tc>`;
}

function tableCellWide(label: string, value: string, colSpan: number): string {
  return `<w:tc><w:tcPr><w:tcW w:w="${2690}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(label)}</w:t></w:r></w:p></w:tc><w:tc><w:tcPr><w:tcW w:w="12478" w:type="dxa"/><w:gridSpan w:val="${colSpan}"/></w:tcPr><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r></w:p></w:tc>`;
}

export function generateDocxXml(data: PlanData): string {
  const { plan, discipline, classYear, classEntity, course, professor } = data;
  const anoSemestre = `${classYear.year}/${classYear.semester}º`;
  const chCreditos = `${discipline.workload_hours}h / ${discipline.credits} créditos`;
  const codNome = `${discipline.code} — ${discipline.name}`;
  const profName = professor?.name || '—';

  const identificationTable = `<w:tbl>
<w:tblPr>
<w:tblW w:w="15168" w:type="dxa"/>
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
<w:gridCol w:w="2690"/><w:gridCol w:w="2981"/><w:gridCol w:w="2128"/><w:gridCol w:w="2125"/><w:gridCol w:w="2551"/><w:gridCol w:w="2693"/>
</w:tblGrid>
<w:tr>${tableCellWide('Curso:', course.name, 5)}</w:tr>
<w:tr>${tableCellWide('Ano/Semestre:', anoSemestre, 5)}</w:tr>
<w:tr>${tableCellWide('Código/Nome da disciplina:', codNome, 5)}</w:tr>
<w:tr>${tableCellWide('CH/Créditos:', chCreditos, 5)}</w:tr>
<w:tr>${tableCellWide('Professor Responsável:', profName, 5)}</w:tr>
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

  // Build a minimal docx (zip) using a simple approach with JSZip-like manual assembly
  // Since we don't have JSZip, we'll use the browser's built-in compression
  const files: Record<string, string> = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'word/document.xml': documentXml,
    'word/_rels/document.xml.rels': docRels,
  };

  // Use a simple approach: create the docx as a .doc (HTML-based) as fallback
  // Actually, let's build a proper zip using CompressionStream API
  // For simplicity and reliability, we'll generate an HTML-based .doc file
  // which Word opens natively
  const htmlContent = generateHtmlDoc(data);
  const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plano_${data.discipline.code}_${data.classYear.year}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateHtmlDoc(data: PlanData): string {
  const { plan, discipline, classYear, classEntity, course, professor } = data;
  const anoSemestre = `${classYear.year}/${classYear.semester}º`;
  const chCreditos = `${discipline.workload_hours}h / ${discipline.credits} créditos`;
  const codNome = `${discipline.code} — ${discipline.name}`;
  const profName = professor?.name || '—';

  const sectionHtml = (label: string, content: string) => `
    <p style="font-family:Arial; font-size:12pt; font-weight:bold; margin-top:12pt; margin-bottom:4pt;">${label}</p>
    <div style="font-family:Arial; font-size:11pt; text-align:justify; line-height:1.4; white-space:pre-wrap;">${content || '<span style="color:#999;">Não preenchido</span>'}</div>`;

  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Plano de Ensino</title>
<style>
@page { size: A4; margin: 2cm; }
body { font-family: Arial, sans-serif; }
table { border-collapse: collapse; width: 100%; }
td { border: 1px solid #000; padding: 4px 6px; font-family: Arial; font-size: 11pt; }
.label-cell { font-weight: bold; width: 30%; }
</style></head>
<body>
<p style="font-family:Arial; font-size:12pt; font-weight:bold; text-align:justify;">INSTITUTO ARQUIDIOCESANO DE FILOSOFIA E TEOLOGIA SÃO JOÃO PAULO II</p>
<p style="font-family:Arial; font-size:12pt; text-align:justify;">Plano de Ensino</p>
<p>&nbsp;</p>
<table>
<tr><td class="label-cell">Curso:</td><td colspan="5">${course.name}</td></tr>
<tr><td class="label-cell">Ano/Semestre:</td><td colspan="5">${anoSemestre}</td></tr>
<tr><td class="label-cell">Código/Nome da disciplina:</td><td colspan="5">${codNome}</td></tr>
<tr><td class="label-cell">CH/Créditos:</td><td colspan="5">${chCreditos}</td></tr>
<tr><td class="label-cell">Professor Responsável:</td><td colspan="5">${profName}</td></tr>
</table>
${sectionHtml('Ementa:', plan.ementa)}
${sectionHtml('COMPETÊNCIAS:', plan.competencias)}
${sectionHtml('Conteúdo:', plan.conteudo)}
${sectionHtml('Bibliografia Básica:', plan.bibliografia_basica)}
${sectionHtml('Bibliografia Complementar:', plan.bibliografia_complementar)}
${sectionHtml('Bibliografia de Aprofundamento:', plan.bibliografia_aprofundamento)}
</body></html>`;
}
