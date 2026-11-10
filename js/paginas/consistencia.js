/* Probador de paleta 60-30-10: cada selector de color cambia una variable CSS
   (--c1, --c2, --c3) que usan las muestras de la página. No guarda nada. */
(function(){
  const r=document.documentElement.style;
  [["p1","--c1"],["p2","--c2"],["p3","--c3"]].forEach(function(p){
    // p[0] = id del <input type="color">; p[1] = variable CSS que actualiza.
    document.getElementById(p[0]).addEventListener("input",function(e){r.setProperty(p[1],e.target.value);});
  });
})();
