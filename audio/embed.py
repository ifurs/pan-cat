"""Embed audio/*.mp3 into index.html between the SND markers (keeps the game a single file)."""
import base64,glob,os,re
here=os.path.dirname(os.path.abspath(__file__));page=os.path.join(here,'..','index.html')
parts=[]
for f in sorted(glob.glob(os.path.join(here,'*.mp3'))):
    parts.append(" %s:'data:audio/mpeg;base64,%s'"%(os.path.basename(f)[:-4],base64.b64encode(open(f,'rb').read()).decode()))
block="/*SND-BEGIN*/const SND_SRC={\n"+",\n".join(parts)+"\n};/*SND-END*/"
s=open(page).read()
s2,n=re.subn(r"/\*SND-BEGIN\*/.*?/\*SND-END\*/",lambda m:block,s,flags=re.S)
assert n==1,'markers not found';open(page,'w').write(s2);print('embedded',len(parts),'sounds,',len(block)//1024,'KB')
