process.on('message', msg => {
    console.log(`Mensaje del proceso padre: ${msg}`);
    process.send(16)
})


let numeros = []
for (let i = 0; i < 10000000; i++) {

    let num = Math.floor(Math.random() * 1000)

    let check = numeros.find(check => check.numero == num);
 
    if (check == undefined) {
        numeros.push({ numero: num, veces: 1 });
    } else {
        let indice = numeros.findIndex(found => found.numero == num)
        numeros[indice].veces++;

    }

}
console.log(numeros);