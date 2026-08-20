export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  let html = await response.text();
  if (html.includes("id=\"gmt-diy-injected\"")) return new Response(html, response);
  const diy = `
<style id="gmt-diy-injected-style">
#gmt-diy-injected{position:fixed;right:22px;bottom:92px;z-index:9998;width:min(340px,calc(100vw - 32px));background:#0d1012;color:#fff;border:1px solid rgba(255,107,0,.45);box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:Inter,Arial,sans-serif;display:none}
#gmt-diy-injected.open{display:block;animation:gmtDiyIn .28s ease both}
#gmt-diy-injected .diy-head{padding:18px 20px;background:linear-gradient(135deg,#ff6b00,#ff8a1f);color:#050505;font-weight:900;text-transform:uppercase;letter-spacing:1px}
#gmt-diy-injected .diy-body{padding:18px 20px}.diy-body img{width:100%;height:125px;object-fit:cover;margin:-2px 0 14px}.diy-body h3{font-size:24px;margin:0 0 4px}.diy-price{font-size:20px;color:#ff8a1f;font-weight:900;margin:8px 0}.diy-body p{font-size:13px;line-height:1.55;color:#aeb7c0;margin:8px 0}.diy-body ul{padding-left:18px;color:#cbd1d6;font-size:12px;line-height:1.65}.diy-close{position:absolute;right:9px;top:8px;background:none;border:0;font-size:20px;color:#050505;cursor:pointer}.diy-cta{display:inline-flex;margin-top:12px;padding:10px 14px;background:#ff6b00;color:#050505;text-decoration:none;font-weight:900;border-radius:4px}.diy-launch{position:fixed;right:22px;bottom:22px;z-index:9999;border:1px solid #ff6b00;background:#0b0d0f;color:#ff8a1f;border-radius:999px;padding:13px 17px;font-weight:900;cursor:pointer;box-shadow:0 12px 30px rgba(0,0,0,.4)}
@keyframes gmtDiyIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
@media(max-width:600px){#gmt-diy-injected{right:16px;bottom:82px}.diy-launch{right:16px;bottom:16px}}
</style>
<div id="gmt-diy-injected">
<button class="diy-close" aria-label="Close DIY Workspace">×</button>
<div class="diy-head">New · DIY Workspace</div>
<div class="diy-body">
<img src="https://raw.githubusercontent.com/gearsganesh/Gearsmotortune/main/Gearsmotortune/diy-workshop-wide-netlify.webp" alt="Gearsmotortune DIY mechanical workspace">
<h3>Bring Your Car. Fix It Yourself.</h3>
<div class="diy-price">₹3,000 / car space / day</div>
<p>9 AM – 6 PM. Use our mechanical bay, two-post lift, pneumatic lines, power tools, complete hand-tool set and parts-washing room.</p>
<ul><li>8–32 mm sockets & spanners</li><li>Wireless impact wrench & power tools</li><li>Drip tray, brake cleaner & WD-40</li><li>Industrial parts cleaner</li><li>Technician assistance: ₹500/hour</li></ul>
<p><strong>Not permitted:</strong> welding, fabrication, painting or body tinkering.</p>
<a class="diy-cta" href="#enquiry">Enquire for DIY Workspace ↗</a>
</div></div>
<button class="diy-launch" id="gmt-diy-launch">⚒ DIY Workspace · ₹3,000/day</button>
<script>
(()=>{const p=document.getElementById('gmt-diy-injected'),b=document.getElementById('gmt-diy-launch'),c=p?.querySelector('.diy-close');if(!p||!b)return;b.onclick=()=>p.classList.toggle('open');c.onclick=()=>p.classList.remove('open');p.querySelector('.diy-cta')?.addEventListener('click',()=>p.classList.remove('open'));const s=document.querySelector('#service');if(s&&!Array.from(s.options).some(o=>o.text==='DIY Workspace')){const o=document.createElement('option');o.text='DIY Workspace';s.add(o)} })();
</script>`;
  html = html.replace("</body>", diy + "</body>");
  return new Response(html, response);
};
