export type DieStatus = 'Good' | 'Defect' | 'Skip' | 'Edge';
export type Die = { dieNumber:number; x:number; y:number; row:number; column:number; centerX:number; centerY:number; status:DieStatus };

export function validatePositive(values: Record<string, number>) {
  const errors: string[] = [];
  for (const [name, value] of Object.entries(values)) if (!Number.isFinite(value) || value <= 0) errors.push(`${name} must be greater than 0.`);
  return errors;
}

/**
 * Radius of the circle in which a die *centre* may sit: the wafer radius minus
 * the edge exclusion ring. Dies whose centre falls outside it are not placed.
 */
export function usableRadius(waferDiameter: number, edgeExclusion: number): number {
  return waferDiameter / 2 - edgeExclusion;
}

function validateGeometry(
  waferDiameter: number,
  edgeExclusion: number,
  pitchX: number,
  pitchY: number,
  errors: string[],
  labels: { x: string; y: string } = { x: 'X pitch', y: 'Y pitch' },
) {
  if (edgeExclusion * 2 >= waferDiameter) errors.push('Edge exclusion must be smaller than the wafer radius.');
  if (errors.length > 0) return;

  const radius = usableRadius(waferDiameter, edgeExclusion);
  if (pitchX > 2 * radius) errors.push(`${labels.x} must be smaller than the usable wafer diameter (diameter minus two edge exclusions).`);
  if (pitchY > 2 * radius) errors.push(`${labels.y} must be smaller than the usable wafer diameter (diameter minus two edge exclusions).`);
}

export function estimateDies(waferDiameter:number, dieWidth:number, dieHeight:number, streetWidth:number, edgeExclusion:number) {
  const errors = validatePositive({ 'Wafer diameter': waferDiameter, 'Die width': dieWidth, 'Die height': dieHeight });
  if (!Number.isFinite(streetWidth) || streetWidth < 0) errors.push('Street width cannot be negative.');
  if (!Number.isFinite(edgeExclusion) || edgeExclusion < 0) errors.push('Edge exclusion cannot be negative.');
  if (errors.length === 0) {
    validateGeometry(waferDiameter, edgeExclusion, dieWidth + streetWidth, dieHeight + streetWidth, errors, {
      x: 'Die width plus street width',
      y: 'Die height plus street width',
    });
  }
  if (errors.length) return { errors } as const;
  const pitchX = dieWidth + streetWidth, pitchY = dieHeight + streetWidth;
  const radius = usableRadius(waferDiameter, edgeExclusion);
  let count = 0;
  for (let x = -Math.ceil(radius / pitchX); x <= Math.ceil(radius / pitchX); x++) for (let y = -Math.ceil(radius / pitchY); y <= Math.ceil(radius / pitchY); y++) if ((x*pitchX)**2 + (y*pitchY)**2 <= radius**2) count++;
  const gross = Math.max(0, Math.floor(waferDiameter / pitchX) * Math.floor(waferDiameter / pitchY));
  return { errors: [], estimatedUsable: count, gross, radius, utilization: count * dieWidth * dieHeight / (Math.PI * (waferDiameter/2)**2) * 100 } as const;
}

/**
 * Input validation for the wafer map generator. Kept separate from
 * `generateWaferMap` so the UI can explain *why* nothing can be placed instead
 * of silently rendering an empty map.
 */
export function validateWaferMapInputs(values: {
  diameter: number; edgeExclusion: number; dieWidth: number; dieHeight: number; pitchX: number; pitchY: number;
}): string[] {
  const errors = validatePositive({
    'Wafer diameter': values.diameter,
    'Die width': values.dieWidth,
    'Die height': values.dieHeight,
    'X pitch': values.pitchX,
    'Y pitch': values.pitchY,
  });

  if (!Number.isFinite(values.edgeExclusion) || values.edgeExclusion < 0) errors.push('Edge exclusion cannot be negative.');
  if (errors.length === 0) validateGeometry(values.diameter, values.edgeExclusion, values.pitchX, values.pitchY, errors);
  if (values.pitchX < values.dieWidth) errors.push('X pitch cannot be smaller than the die width.');
  if (values.pitchY < values.dieHeight) errors.push('Y pitch cannot be smaller than the die height.');

  return errors;
}

export function generateWaferMap(diameter:number, edgeExclusion:number, dieWidth:number, dieHeight:number, pitchX:number, pitchY:number, offsetX:number, offsetY:number): Die[] {
  if (validateWaferMapInputs({ diameter, edgeExclusion, dieWidth, dieHeight, pitchX, pitchY }).length > 0) return [];
  const radius = usableRadius(diameter, edgeExclusion), dies: Die[] = []; const maxX=Math.ceil(radius/pitchX)+1, maxY=Math.ceil(radius/pitchY)+1;
  let n=1;
  for(let row=-maxY;row<=maxY;row++) for(let column=-maxX;column<=maxX;column++) { const centerX=column*pitchX+offsetX, centerY=row*pitchY+offsetY; if(centerX**2+centerY**2<=radius**2){ const edge=(Math.abs(Math.hypot(centerX,centerY)+Math.max(dieWidth,dieHeight)/2-radius)<Math.max(pitchX,pitchY)); dies.push({dieNumber:n++,x:column,y:row,row,column,centerX,centerY,status:edge?'Edge':'Good'}); }}
  return dies;
}
