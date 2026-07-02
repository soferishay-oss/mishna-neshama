import { ref, set, get, child, serverTimestamp, update } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, isMockMode } from "./firebase";
import { HDate } from "@hebcal/core";

export interface EventData {
  id: string; // The short code (e.g. 1005)
  deceasedName: string;
  deceasedTitle?: string;
  deceasedGender: 'male' | 'female';
  passingDate: string; // YYYY-MM-DD
  burialDate: string; // YYYY-MM-DD
  showGregorian: boolean;
  organizerName: string;
  organizerPhone: string;
  organizerEmail: string;
  whatsappGroup: string;
  photoUrl?: string;
  
  // Calculated or Set Targets
  targetType?: 'shloshim' | 'yahrzeit' | 'custom';
  targetDateStr?: string; // Gregorian ISO target
  targetDateHebrew?: string; // Hebrew date string
  
  // Legacy calculated
  shloshimDateStr: string;
  yahrzeitDateStr: string;
  shloshimDateHebrew?: string;
  yahrzeitDateHebrew?: string;
  createdAt: any;
  previousEventId?: string;
}

// Generate a random 4-5 digit code
async function generateUniqueCode(): Promise<string> {
  const dbRef = ref(db);
  let code = "";
  let exists = true;
  while (exists) {
    code = Math.floor(1000 + Math.random() * 9000).toString(); // 1000-9999
    
    if (isMockMode) {
      const res = await fetch(`/api/mockdb?path=events/${code}`);
      const data = await res.json();
      if (!data) {
        exists = false;
      }
    } else {
      const snapshot = await get(child(dbRef, `events/${code}`));
      if (!snapshot.exists()) {
        exists = false;
      }
    }
  }
  return code;
}

export async function createStudyEvent(data: Omit<EventData, "id" | "shloshimDateStr" | "yahrzeitDateStr" | "createdAt" | "shloshimDateHebrew" | "yahrzeitDateHebrew">, imageFile?: File | null): Promise<string> {
  
  // Calculate Dates using hebcal
  const bDate = new Date(data.burialDate);
  const pDate = new Date(data.passingDate);
  
  const burialHDate = new HDate(bDate);
  const passingHDate = new HDate(pDate);
  
  // Shloshim is generally calculated from Burial
  const shloshimHDate = burialHDate.add(29, 'd'); 
  // Yahrzeit is generally calculated from Passing
  const yahrzeitHDate = passingHDate.add(1, 'y');

  const shloshimDateHebrew = shloshimHDate.renderGematriya(true);
  const yahrzeitDateHebrew = yahrzeitHDate.renderGematriya(true);
  
  const shloshimDateStr = shloshimHDate.greg().toISOString();
  const yahrzeitDateStr = yahrzeitHDate.greg().toISOString();

  let targetDateStr = shloshimDateStr;
  let targetDateHebrew = shloshimDateHebrew;

  if (data.targetType === 'yahrzeit') {
    // We expect the front-end to pass a pre-calculated custom target if it's a specific year,
    // but if we want to default to next yahrzeit, it's easier if the frontend just calculates the exact date and passes it as custom, 
    // OR the frontend passes `targetType: 'yahrzeit'` and a specific `targetDateStr` (we shouldn't override it here if it exists).
    // Actually, to make it simple, we'll let the frontend pass customTargetDate via data if it's custom or specific yahrzeit year.
    // We'll handle this in the payload construction.
  }

  if (isMockMode) {
    const code = await generateUniqueCode();
    let photoUrl = "";
    if (imageFile) {
      photoUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    }

    const eventPayload: EventData = {
      ...data,
      id: code,
      photoUrl,
      showGregorian: data.showGregorian,
      shloshimDateStr,
      yahrzeitDateStr,
      shloshimDateHebrew,
      yahrzeitDateHebrew,
      targetType: data.targetType || 'shloshim',
      targetDateStr: data.targetType === 'custom' ? data.targetDateStr : (data.targetType === 'yahrzeit' ? data.targetDateStr || yahrzeitDateStr : shloshimDateStr),
      targetDateHebrew: data.targetType === 'custom' ? data.targetDateHebrew : (data.targetType === 'yahrzeit' ? data.targetDateHebrew || yahrzeitDateHebrew : shloshimDateHebrew),
      deceasedTitle: data.deceasedTitle || '',
      previousEventId: data.previousEventId || '',
      createdAt: new Date().toISOString(),
    };
    
    await fetch('/api/mockdb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `events/${code}`,
        data: eventPayload
      })
    });
    
    return code;
  }

  const code = await generateUniqueCode();
  
  let photoUrl = "";
  if (imageFile) {
    if (isMockMode) {
      photoUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageFile);
      });
    } else {
      const fileRef = storageRef(storage, `events/${code}/${imageFile.name}`);
      await uploadBytes(fileRef, imageFile);
      photoUrl = await getDownloadURL(fileRef);
    }
  }

  const eventPayload: EventData = {
    ...data,
    id: code,
    photoUrl,
    shloshimDateStr,
    yahrzeitDateStr,
    shloshimDateHebrew,
    yahrzeitDateHebrew,
    targetType: data.targetType || 'shloshim',
    targetDateStr: data.targetType === 'custom' ? data.targetDateStr : (data.targetType === 'yahrzeit' ? data.targetDateStr || yahrzeitDateStr : shloshimDateStr),
    targetDateHebrew: data.targetType === 'custom' ? data.targetDateHebrew : (data.targetType === 'yahrzeit' ? data.targetDateHebrew || yahrzeitDateHebrew : shloshimDateHebrew),
    deceasedTitle: data.deceasedTitle || '',
    previousEventId: data.previousEventId || '',
    createdAt: serverTimestamp(),
  };

  await set(ref(db, `events/${code}`), eventPayload);
  
  return code;
}

export async function updateEventImage(code: string, imageFile: File): Promise<string> {
  if (isMockMode) {
    const photoUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });
    await fetch(`/api/mockdb?path=events/${code}/photoUrl`, { method: 'PUT', body: JSON.stringify(photoUrl) });
    return photoUrl;
  }
  
  const fileRef = storageRef(storage, `events/${code}/${imageFile.name}`);
  await uploadBytes(fileRef, imageFile);
  const photoUrl = await getDownloadURL(fileRef);
  await update(ref(db, `events/${code}`), { photoUrl });
  return photoUrl;
}
