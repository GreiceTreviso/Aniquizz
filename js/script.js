//const numeroAleatorio = Math.random()

const numeroAleatorio = Math.floor(Math.random()*6)+1
console.log("Número sorteado: "+ numeroAleatorio)

const n1 = Math.floor(2.9)
const n2 = Math.ceil(2.9)
const n3 = Math.round(2.4) // .5 

console.log(n1) //2
console.log(n2) //3
console.log(n3) //

for(let i=0;i<=5;i++){
    const carta = document.createElement("div")
    const texto = document.createElement("p")

    texto.textContent = `${numeroAleatorio}`
    carta.appendChild(texto)
    carta.classList.add('cartaFormatada')

    document.querySelector("#tudo").appendChild(carta)
    //alert("Número sorteado: "+ numeroAleatorio)
}
