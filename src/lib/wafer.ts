export type DieStatus = 'Good' | 'Defect' | 'Skip' | 'Edge';
export type Die = { dieNumber:number; x:number; y:number; row:number; column:number; centerX:number; centerY:number; status:DieStatus };

export function validatePositive(values: Record<string, number>) {
  const errors: string[] = [];
  for (const [name, value] of Object.entries(values)) if (!Number.isFinite(value) || value <= 0) errors.push(`${name} must be greater than 0.`);
  return errors;
}

export function estimateDies(waferDiameter:number, dieWidth:number, dieHeight:number, streetWidth:number, edgeExclusion:number) {
  const errors = validatePositive({ 'Wafer diameter': waferDiameter, 'Die width': dieWidth, 'Die height': dieHeight });
  if (!Number.isFinite(streetWidth) || streetWidth < 0) errors.push('Street width cannot be negative.');
  if (!Number.isFinite(edgeExclusion) || edgeExclusion < 0) errors.push('Edge exclusion cannot be negative.');
  if (edgeExclusion * 2 >= waferDiameter) errors.push('Edge exclusion must be smaller than the wafer radius.');
  if (errors.length) return { errors } as const;
  const pitchX = dieWidth + streetWidth, pitchY = dieHeight + streetWidth;
  const radius = waferDiameter / 2 - edgeExclusion;
  let count = 0;
  for (let x = -Math.ceil(radius / pitchX); x <= Math.ceil(radius / pitchX); x++) for (let y = -Math.ceil(radius / pitchY); y <= Math.ceil(radius / pitchY); y++) if ((x*pitchX)**2 + (y*pitchY)**2 <= radius**2) count++;
  const gross = Math.max(0, Math.floor(waferDiameter / pitchX) * Math.floor(waferDiameter / pitchY));
  return { errors: [], estimatedUsable: count, gross, radius, utilization: count * dieWidth * dieHeight / (Math.PI * (waferDiameter/2)**2) * 100 } as const;
}

export function generateWaferMap(diameter:number, edgeExclusion:number, dieWidth:number, dieHeight:number, pitchX:number, pitchY:number, offsetX:number, offsetY:number): Die[] {
  if ([diameter,dieWidth,dieHeight,pitchX,pitchY].some(v => !Number.isFinite(v) || v <= 0) || edgeExclusion < 0) return [];
  const radius = diameter/2-edgeExclusion, dies: Die[] = []; const maxX=Math.ceil(radius/pitchX)+1, maxY=Math.ceil(radius/pitchY)+1;
  let n=1;
  for(let row=-maxY;row<=maxY;row++) for(let column=-maxX;column<=maxX;column++) { const centerX=column*pitchX+offsetX, centerY=row*pitchY+offsetY; if(centerX**2+centerY**2<=radius**2){ const edge=(Math.abs(Math.hypot(centerX,centerY)+Math.max(dieWidth,dieHeight)/2-radius)<Math.max(pitchX,pitchY)); dies.push({dieNumber:n++,x:column,y:row,row,column,centerX,centerY,status:edge?'Edge':'Good'}); }}
  return dies;
}