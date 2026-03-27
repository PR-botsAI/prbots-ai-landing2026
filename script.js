/* === PRbots.ai Landing Page Script === */

/* --- URL Param Personalization --- */
(function(){
  var params=new URLSearchParams(window.location.search);
  var fields={};
  var paramMap={
    'first_name':'firstName','last_name':'lastName','full_name':'fullName',
    'email':'email','phone':'phone','company':'company',
    'city':'city','state':'state','country':'country'
  };
  var skipTags={'SCRIPT':1,'STYLE':1,'NOSCRIPT':1,'TEXTAREA':1,'CODE':1,'PRE':1};
  var hasUrlFields=false;
  for(var p in paramMap){
    var v=params.get(p);
    if(v){fields[paramMap[p]]=v;hasUrlFields=true;}
  }
  var contactId=params.get('contact_id');
  function esc(s){
    if(!s)return s;
    var d=document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function doReplace(data){
    var r={};
    r['{{full_name}}']=esc(((data.firstName||'')+' '+(data.lastName||'')).trim()||((data.fullName||data.name)||''));
    r['{{first_name}}']=esc(data.firstName||(data.name?data.name.split(' ')[0]:'')||'');
    r['{{last_name}}']=esc(data.lastName||(data.name&&data.name.indexOf(' ')>-1?data.name.substring(data.name.indexOf(' ')+1):'')||'');
    r['{{email}}']=esc(data.email||'');
    r['{{phone}}']=esc(data.phone||'');
    r['{{company}}']=esc(data.company||'');
    r['{{city}}']=esc(data.city||'');
    r['{{state}}']=esc(data.state||'');
    r['{{country}}']=esc(data.country||'');
    r['{{date}}']=new Date().toLocaleDateString();
    r['{{time}}']=new Date().toLocaleTimeString();
    r['{{location}}']=[data.city,data.state,data.country].filter(Boolean).join(', ');
    var hasValues=false;
    for(var key in r){if(r[key]){hasValues=true;break;}}
    if(!hasValues)return;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){
        var p=n.parentNode;
        if(p&&skipTags[p.nodeName])return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while(node=walker.nextNode()){
      var txt=node.nodeValue;
      if(txt&&txt.indexOf('{{')>-1){
        var changed=txt;
        for(var ph in r){
          if(r[ph]&&changed.indexOf(ph)>-1){
            changed=changed.split(ph).join(r[ph]);
          }
        }
        if(changed!==txt)node.nodeValue=changed;
      }
    }
  }
  function run(){
    if(contactId){
      var xhr=new XMLHttpRequest();
      xhr.open('GET','https://paymegpt.com/api/landing/context/'+encodeURIComponent(contactId)+'?page_id=2074');
      xhr.onload=function(){
        if(xhr.status===200){
          try{
            var resp=JSON.parse(xhr.responseText);
            if(resp.success&&resp.contact){
              var merged=resp.contact;
              for(var k in fields){merged[k]=fields[k];}
              doReplace(merged);
              return;
            }
          }catch(e){}
        }
        if(hasUrlFields)doReplace(fields);
      };
      xhr.onerror=function(){if(hasUrlFields)doReplace(fields);};
      xhr.send();
    }else if(hasUrlFields){
      doReplace(fields);
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}
  else{run();}
})();

/* --- Payment Processing --- */
(function(){
  var slug='KUTvs2YTb';
  var apiBase='https://paymegpt.com';
  function findEmail(){
    var ids=['email','emailAddress','form-email','buyer-email'];
    for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.value&&el.value.includes('@'))return el.value.trim();}
    var inputs=document.querySelectorAll('input[type="email"]');
    for(var j=0;j<inputs.length;j++){if(inputs[j].value&&inputs[j].value.includes('@'))return inputs[j].value.trim();}
    return '';
  }
  function findName(){
    var ids=['name','fullName','form-name'];
    for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el&&el.value)return el.value.trim();}
    return '';
  }
  var __realProcessPayment=function(a){
    var amountCents,email,productName,productDescription,customerName,quantity;
    if(a&&typeof a==='object'){
      amountCents=a.amountCents;email=a.email;productName=a.productName;
      productDescription=a.productDescription||'';customerName=a.name||'';quantity=a.quantity||1;
    }else{return Promise.reject('invalid');}
    if(!email)email=findEmail();
    if(!customerName)customerName=findName();
    if(!productName){alert('Product name is required.');return Promise.reject('no_product_name');}
    if(!amountCents||amountCents<100){alert('Amount must be at least $1.00');return Promise.reject('invalid_amount');}
    if(!email){alert('Please enter your email address.');return Promise.reject('no_email');}
    var successBase=window.location.href.split('?')[0];
    return fetch(apiBase+'/api/landing-pages/public/'+slug+'/payment/checkout',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,name:customerName,amountCents:amountCents,productName:productName,productDescription:productDescription,quantity:quantity,successUrl:successBase+'?payment=success&product='+encodeURIComponent(productName)+'&session_id={CHECKOUT_SESSION_ID}',cancelUrl:successBase+'?payment=cancelled'})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.checkoutUrl){window.location.href=d.checkoutUrl;}
      else{alert(d.error||'Failed to process payment');throw new Error(d.error);}
    });
  };
  Object.defineProperty(window,'__processPayment',{value:__realProcessPayment,writable:false,configurable:false});
})();

/* --- Contact Form Submission --- */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var form = document.getElementById('lead-form');
    if(!form) return;

    var statusEl = document.getElementById('form-status');
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', function(e){
      e.preventDefault();

      var name = document.getElementById('form-name').value.trim();
      var email = document.getElementById('form-email').value.trim();
      var phone = document.getElementById('form-phone').value.trim();
      var smsOptin = document.getElementById('sms-optin').checked;

      if(!name || !email){
        statusEl.textContent = 'Por favor completa nombre y email.';
        statusEl.className = 'form-status error';
        return;
      }

      // Disable button while submitting
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      // POST to create contact via Orchestrator agent
      fetch('https://paymegpt.com/api/landing-pages/public/KUTvs2YTb/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          smsOptIn: smsOptin,
          widgetId: 39435347,
          source: 'landing_page_form'
        })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        // Success
        statusEl.innerHTML = '✅ <strong>¡Solicitud recibida!</strong> Un estratega te contactará en menos de 24 horas.';
        statusEl.className = 'form-status success';
        form.reset(); // Clears all fields and unchecks checkbox
        submitBtn.disabled = false;
        submitBtn.textContent = 'Solicitar Evaluación Gratis';
      })
      .catch(function(err){
        statusEl.textContent = '❌ Error al enviar. Por favor intenta de nuevo.';
        statusEl.className = 'form-status error';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Solicitar Evaluación Gratis';
      });
    });
  });
})();

/* --- Widget Config --- */
window.PayMeGPTConfig={widgetId:'44460389',type:'voice_launcher',primaryColor:'#FF3D5A',position:'bottom-right',label:'Habla con BOTi',icon:'mic',startButtonText:'Comenzar',stopButtonText:'Terminar',theme:'dark',customFooterText:'PRbots.ai · Hecho en Puerto Rico 🇵🇷'};