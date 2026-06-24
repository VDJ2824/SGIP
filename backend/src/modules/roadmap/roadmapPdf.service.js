import PDFDocument from 'pdfkit';

const colors = {
  ink: '#17312d',
  muted: '#60756e',
  brand: '#347f73',
  accent: '#4d7f99',
  line: '#cfddd5',
  soft: '#edf4ef',
  warning: '#9a5b13',
};

function contentBounds(doc, inset = 0) {
  return {
    x: doc.page.margins.left + inset,
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right - inset * 2,
  };
}

function ensureSpace(doc, height = 80) {
  if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
}

function heading(doc, text, size = 15) {
  ensureSpace(doc, 40);
  doc.moveDown(0.5).font('Helvetica-Bold').fontSize(size).fillColor(colors.ink).text(text);
  doc.moveDown(0.25);
}

function labelValue(doc, label, value) {
  const { x, width } = contentBounds(doc);
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(colors.muted)
    .text(`${label.toUpperCase()}  `, x, doc.y, { continued: true, width });
  doc.font('Helvetica').fillColor(colors.ink).text(String(value), { width });
}

function bulletList(doc, items = []) {
  const { x, width } = contentBounds(doc, 8);
  for (const item of items.filter(Boolean)) {
    ensureSpace(doc, 24);
    doc.font('Helvetica').fontSize(9.5).fillColor(colors.ink).text(`• ${item}`, x, doc.y, {
      width,
      paragraphGap: 3,
    });
  }
}

function taskBlock(doc, task) {
  ensureSpace(doc, 150);
  const top = doc.y;
  const { x, width } = contentBounds(doc);

  doc
    .roundedRect(x, top, width, 30, 6)
    .fill(colors.soft);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(colors.ink)
    .text(task.title, x + 10, top + 9, { width: width - 90, lineBreak: false });
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(task.priority === 'High' ? '#9f1239' : task.priority === 'Medium' ? colors.warning : colors.accent)
    .text(task.priority, x + width - 70, top + 10, {
      width: 60,
      align: 'right',
      lineBreak: false,
    });

  doc.y = top + 40;
  doc.x = x;
  if (task.description) {
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(colors.muted)
      .text(task.description, x, doc.y, { width, paragraphGap: 5 });
  }
  labelValue(doc, 'Related skill', task.relatedSkill || 'General career readiness');
  labelValue(doc, 'Estimate', `${task.estimatedWeeks ?? 0} week(s), ${task.estimatedHours ?? 0} hour(s)`);
  labelValue(doc, 'Status', String(task.status || 'not_started').replaceAll('_', ' '));

  if (task.suggestedResources?.length) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.muted).text('RESOURCES', x, doc.y, { width });
    bulletList(doc, task.suggestedResources);
  }
  if (task.suggestedProjects?.length) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.muted).text('SUGGESTED PROJECT', x, doc.y, { width });
    bulletList(doc, task.suggestedProjects);
  }
  if (task.completionCriteria?.length) {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.muted).text('COMPLETION CRITERIA', x, doc.y, { width });
    bulletList(doc, task.completionCriteria);
  }
  doc.moveDown(0.7);
}

function findNextAction(roadmap) {
  const incomplete = (roadmap.phases || [])
    .flatMap((phase) => phase.tasks || [])
    .filter((task) => !['completed', 'skipped'].includes(task.status));
  return incomplete.find((task) => task.priority === 'High') || incomplete[0] || null;
}

export function createRoadmapPdf(roadmap) {
  const doc = new PDFDocument({
    size: 'A4',
    bufferPages: true,
    margins: { top: 48, bottom: 48, left: 52, right: 52 },
    info: {
      Title: 'SGIP Personalized Learning Roadmap',
      Author: 'Skill Gap Intelligence Platform',
      Subject: 'Personalized learning and career-readiness roadmap',
    },
  });

  doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.brand).text('Skill Gap Intelligence Platform');
  doc.font('Helvetica').fontSize(12).fillColor(colors.accent).text('Personalized Learning Roadmap');
  doc.moveDown(0.8);
  doc.strokeColor(colors.line).lineWidth(1).moveTo(52, doc.y).lineTo(543, doc.y).stroke();

  heading(doc, '1. Student Roadmap Summary');
  labelValue(doc, 'Target career role', roadmap.targetRoleSnapshot?.title || 'Not specified');
  labelValue(doc, 'Readiness score', `${roadmap.readinessScoreAtGeneration ?? 0}%`);
  labelValue(doc, 'Estimated completion', `${roadmap.estimatedCompletionWeeks ?? 0} weeks`);
  labelValue(doc, 'Current progress', `${roadmap.overallProgress ?? 0}%`);
  labelValue(
    doc,
    'Generated on',
    new Date(roadmap.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  );

  heading(doc, '2. Phase-wise Roadmap');
  for (const phase of roadmap.phases || []) {
    ensureSpace(doc, 100);
    const { x, width } = contentBounds(doc);
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(colors.brand)
      .text(`Phase ${phase.phaseNumber}: ${phase.title}`, x, doc.y, { width });
    if (phase.description) {
      doc.font('Helvetica').fontSize(9.5).fillColor(colors.muted).text(phase.description, x, doc.y, { width });
    }
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(colors.ink)
      .text(
        `Priority: ${phase.priority}   |   Estimated: ${phase.estimatedWeeks ?? 0} week(s)   |   Progress: ${phase.progress ?? 0}%`,
        x,
        doc.y,
        { width },
      );
    doc.moveDown(0.5);

    if (!phase.tasks?.length) {
      doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(colors.muted).text('No tasks required in this phase.');
      doc.moveDown();
      continue;
    }
    for (const item of phase.tasks) taskBlock(doc, item);
  }

  heading(doc, '3. Next Recommended Action');
  const nextAction = findNextAction(roadmap);
  if (nextAction) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.ink).text(nextAction.title);
    doc.font('Helvetica').fontSize(9.5).fillColor(colors.muted).text(nextAction.description || '');
    labelValue(doc, 'Priority', nextAction.priority);
    labelValue(doc, 'Related skill', nextAction.relatedSkill || 'Career readiness');
  } else {
    doc.font('Helvetica').fontSize(9.5).fillColor(colors.ink).text('All roadmap tasks are complete.');
  }

  heading(doc, '4. Important Note');
  bulletList(doc, [
    'This roadmap is based on the latest saved Gap Analysis used when the roadmap was generated.',
    'Roadmap task progress does not automatically modify the readiness score.',
    'The readiness score updates only after running Gap Analysis again.',
  ]);

  const pageRange = doc.bufferedPageRange();
  for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
    doc.switchToPage(index);
    // Footer stamping is outside document flow. Removing the bottom flow margin
    // prevents PDFKit from creating a new page for each buffered-page footer.
    doc.page.margins.bottom = 0;
    const footerY = doc.page.height - 30;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(colors.muted)
      .text(`SGIP Roadmap  •  Page ${index + 1}`, 52, footerY, {
        width: doc.page.width - 104,
        align: 'center',
        lineBreak: false,
      });
  }

  return doc;
}
