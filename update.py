import sys
with open('src/app/create/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add checkRecentDuplicateEvent to imports
c = c.replace('import { createStudyEvent, updateEventImage } from "@/lib/events";', 'import { createStudyEvent, updateEventImage, checkRecentDuplicateEvent } from "@/lib/events";')

# Add state variables after selectedImage
state_anchor = 'const [selectedImage, setSelectedImage] = useState<File | null>(null);'
state_new = state_anchor + '\n  const [duplicateWarningEvent, setDuplicateWarningEvent] = useState<any>(null);\n  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);'
c = c.replace(state_anchor, state_new)

# Add logic inside handleSubmit
submit_anchor = 'const payload = {'
submit_new = '''if (!isEditMode && !skipDuplicateCheck) {
        const duplicateEvent = await checkRecentDuplicateEvent(formData.deceasedName, passingDateStr, burialDateStr);
        if (duplicateEvent) {
          setDuplicateWarningEvent(duplicateEvent);
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {'''
c = c.replace(submit_anchor, submit_new, 1)

with open('src/app/create/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
