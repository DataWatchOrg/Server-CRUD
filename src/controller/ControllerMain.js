const express = require("express")
const router = express.Router()
const fs = require('fs')
const queryBuilder = require('../service/query-builder')
const { Parser } = require('json2csv');
const bcrypt = require('bcryptjs');
const Main = require('../model/Main');
const MonitoredData = require('../model/MonitoredData');
const Usuario = require('../model/Usuario');

let campos_dados_pessoais

router.get('/saveJSON', async (req, res) => {

    campos_dados_pessoais = (await MonitoredData.find()).map(d => d.dado)

    fs.readFile('./assets/teste.json', 'utf-8', (error, data) => {
        if (error) {
            throw new Error('Falha na leitura do arquivo.')
        }

        const json = JSON.parse(data)
        const updated_fields = {
            'id_usuario': json.id,
            'data': new Date(),
            'tipo_de_requisicao': json.tipo_de_requisicao,
            'campos_alterados': Object.keys(json).filter((key) => {
                return campos_dados_pessoais.includes(key)
            })
        }

        if (updated_fields.campos_alterados.length > 0) {
            new Main(updated_fields).save().then((e) => {
                res.status(200).json(e)
            })
        } else {
            res.status(200).json()
        }
    })
});

router.get('/relatorio', (req, res) => {

   Main.find().then((itens) => {
        const relatorio = []
            itens.forEach(obj => {
                    var campos = '';
                    obj.campos_alterados.forEach(campo => {
                        campos += campo+'\t - '
                    });
                relatorio.push({ campos_alterados: campos, id_usuario: obj.id_usuario, data: obj.data, requisicao: obj.tipo_de_requisicao });
            });

        const json2csvParser = new Parser({ delimiter: ';'});
        const tsv = json2csvParser.parse(relatorio);

        res.setHeader("charset", "utf-8");
        res.header("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", "attachment; filename=tutorials.csv");
        res.status(200).end(tsv);
   })


});

router.post('/usuario/logar', (req, res) => {

    Usuario.findOne({email: req.body.email}).then((usuario) => {

        if(usuario === null) return res.status(403).send("Usu??rio ou senha incorreto");

        if(!bcrypt.compareSync(req.body.senha, usuario.senha))
            return res.status(403).send("Usu??rio ou senha incorreto");
        else{
            return res.status(200).json(usuario);
        }
    })
})

router.post('/usuario/cadastrar', (req, res) => {

    Usuario.findOne({email: req.body.email}).then((usuario) => {

        if(usuario) return res.status(202).send("Usu??rio j?? cadastrado");
        else{
            req.body.senha = bcrypt.hashSync(req.body.senha, 10);
            const novoUsuario = new Usuario( req.body)
            novoUsuario.save().then((e) => {
                res.status(200).json(e)
            }).catch((e) => {
                res.send(e)
            })
        }

    });


})

router.get('/listardocumentos', (req, res) => {
    let find = {};

    if(req.query.id_usuario) find.id_usuario = parseInt(req.query.id_usuario);
    if(req.query.operacao) find.operacao = req.query.operacao;
    if(req.query.id_operador) find.id_operador = parseInt(req.query.id_operador);
    if(req.query.tipo_de_requisicao) find.tipo_de_requisicao = req.query.tipo_de_requisicao;

    Main.find(find).then((itens) => {
        res.json(itens)
    })
});

router.get('/listar', (req, res) => {


     res.send("ok");
});
router.post('/',  (req, res) => {
    /* Aqui podemos receber algumas coisas :) */
    new Main({'nome': "freddie mercury", "endereco": "Casa da m??e joana"}).save().then((e) => {
        res.status(200).json(e) /* Teste ao salvar no BD */
    })

});

router.put('/', (req, res) => {

});

router.delete('/', (req, res) => {

});

router.post('/buscar', async (req, res)=> {
    res.json(await Main.find(queryBuilder.filterByFields(req.body)))
})

module.exports = router;
