"""Optional: embed audio/music/theme.mp3 as the background song (MUS_SRC) in index.html.
Without it the game plays its own WebAudio chiptune. Run with --remove to go back to the chiptune."""
import base64,os,re,sys
here=os.path.dirname(os.path.abspath(__file__));page=os.path.join(here,'..','index.html')
src=os.path.join(here,'music','theme.mp3')
block='/*MUS-BEGIN*//*MUS-END*/' if '--remove' in sys.argv else \
  "/*MUS-BEGIN*/const MUS_SRC='data:audio/mpeg;base64,%s';/*MUS-END*/"%base64.b64encode(open(src,'rb').read()).decode()
s=open(page).read()
s2,n=re.subn(r"/\*MUS-BEGIN\*/.*?/\*MUS-END\*/",lambda m:block,s,flags=re.S)
assert n==1,'markers not found';open(page,'w').write(s2);print('music block',len(block)//1024,'KB')
