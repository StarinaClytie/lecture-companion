export function toggleSelection(rows,current,id,{range=false,anchor=null}={}) {
 const index=rows.findIndex(r=>r.id===id);if(index<0)return current;
 const anchorIndex=rows.findIndex(r=>r.id===anchor);
 if(range&&anchorIndex>=0)return rows.slice(Math.min(index,anchorIndex),Math.max(index,anchorIndex)+1).map(r=>r.id);
 const next=new Set(current);next.has(id)?next.delete(id):next.add(id);return rows.filter(r=>next.has(r.id)).map(r=>r.id);
}
export function selectionBundle(rows,ids) {
 const chosen=new Set(ids),selected=rows.filter(r=>chosen.has(r.id));const first=rows.findIndex(r=>chosen.has(r.id));
 return {rows:selected,text:selected.map(r=>r.text).join('\n\n'),context:first<0?[]:rows.slice(Math.max(0,first-3),first),start:selected[0]?.time??0,end:selected.at(-1)?.time??0,key:JSON.stringify(selected.map(r=>r.id))};
}
