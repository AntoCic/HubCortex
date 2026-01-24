import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { db } from '../../admin';
import { REGION } from '../../env';
import { Timestamp } from 'firebase-admin/firestore';

type OldItem = Omit<SyncItem, 'oldItems'>
interface SyncItem {
  collectionName: string;
  id: string;
  action: 'create' | 'update' | 'delete';
  changedKeys: string;
  updatedAt: Timestamp;
  deleteAt: Timestamp | null;
  oldItems?: OldItem[];
}

// === Helper: costruisce il SyncItem corrente =================================
function buildSyncItem(
  collectionName: string,
  id: string,
  action: 'create' | 'update' | 'delete',
  changedKeysList: string[],
  updatedAt: Timestamp,
): SyncItem {
  return {
    collectionName,
    id,
    action,
    changedKeys: changedKeysList.join(', '),
    updatedAt,
    deleteAt: action === 'delete' ? updatedAt : null,
  };
}

// === Helper: salva il syncItem in /sync/{collectionName} ==============
async function writeSyncDb(collectionName: string, item: SyncItem): Promise<void> {
  const docRef = db.doc(`sync/${collectionName}`);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      const toSave: SyncItem = { ...item, oldItems: [] };
      tx.set(docRef, toSave, { merge: false });
      return;
    }

    const prevData = snap.data() as SyncItem;

    const prevOldItems = Array.isArray(prevData.oldItems) ? prevData.oldItems.slice() : [];
    const { oldItems, ...prevCopy } = prevData;
    prevOldItems.push(prevCopy);

    if (prevOldItems.length > 10) {
      const toRemove = prevOldItems.length - 10;
      prevOldItems.splice(0, toRemove);
    }

    const nextDoc: SyncItem = { ...item, oldItems: prevOldItems };
    tx.set(docRef, nextDoc, { merge: false });
  });

  // Log stringa “carina”
  // const pretty = `[${item.updatedAt}] [sync] ${collectionName}.${item.action} id=${item.id}` +
  //   (item.changedKeys ? ` changes=[${item.changedKeys}]` : '') +
  //   (item.deleteAt ? ` deleteAt=${item.deleteAt}` : '');
  // console.log(pretty);
}

// === 🔔 syncWatcher ====================================
export function syncWatcher(collectionName: string) {
  return onDocumentWritten(
    { region: REGION, document: `${collectionName}/{id}` },
    async (event) => {
      const id = event.params.id;
      const beforeExists = event.data?.before.exists ?? false;
      const afterExists = event.data?.after.exists ?? false;

      let action: SyncItem['action'];
      if (!beforeExists && afterExists) action = 'create';
      else if (beforeExists && !afterExists) action = 'delete';
      else action = 'update';

      const before = beforeExists ? (event.data!.before.data() as Record<string, any>) : undefined;
      const after = afterExists ? (event.data!.after.data() as Record<string, any>) : undefined;

      let changedKeysList: string[] = [];
      if (action === 'update' && before && after) {
        changedKeysList = Object.keys({ ...before, ...after })
          .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
          .slice(0, 6);
      }
      const updatedAt: Timestamp = (after?.updatedAt as Timestamp | undefined) ?? Timestamp.now();
      const item = buildSyncItem(collectionName, id, action, changedKeysList, updatedAt);
      await writeSyncDb(collectionName, item);
    }
  );
}
