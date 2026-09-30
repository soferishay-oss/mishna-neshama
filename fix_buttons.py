with open("src/app/event/[id]/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("<button onClick={() => setShowJoinForm(false)}", "<button type=\"button\" onClick={() => setShowJoinForm(false)}")
c = c.replace("<button onClick={handleJoin}", "<button type=\"submit\" onClick={handleJoin}")

with open("src/app/event/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
