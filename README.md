# Assistente da Serraria — versão 4

Site estático, pensado primeiro para celulares e para funcionar sem conta ou servidor de dados. Pode ser publicado no GitHub Pages.

## O que esta versão faz

- Cria notas com nome, CPF, endereço e telefone opcionais.
- Separa **quantidade de peças** do **comprimento de cada peça**. Ex.: 5 peças de 1,25 m = 6,25 m no total.
- Calcula vendas por unidade, quilo, milheiro (1.000 unidades), metro linear, uma base de metros (ex.: R$ 10 por 2 m) e metro quadrado.
- Em produtos vendidos por m², calcula a área usando quantidade × comprimento × largura de cada peça.
- Marca os produtos cuja unidade de cobrança ainda não foi confirmada. Esses itens não podem entrar numa nota até que a forma de cobrança seja definida em **Preços**, para evitar um total incorreto.
- Guarda a nota e abre uma versão para impressão ou salvamento em PDF.
- Guarda o histórico das notas no navegador.
- Permite pesquisar e editar estoque, registrar entradas, saídas e ajustes.
- Permite editar, cadastrar e excluir preços, incluindo observações sobre medidas incertas.
- Exporta Excel com as abas Estoque, Preços, Movimentações, Notas e Itens das notas; as observações de preço e as medidas de peças/áreas também são exportadas.
- Exporta/restaura uma cópia completa `.json`.
- Usa armazenamento local e guarda os arquivos do site para acesso offline após a primeira visita, quando o navegador permitir.

## Publicar no GitHub Pages

1. Antes de substituir a versão anterior, abra **Arquivos e cópias → Salvar cópia de segurança (JSON)** para guardar os dados atuais.
2. Descompacte o ZIP e envie **todos os arquivos da pasta** para a raiz do repositório: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js` e `icon.svg`.
3. No repositório, abra **Settings → Pages** e configure para publicar a partir da branch principal (`main`) e da pasta `/(root)`.
4. Abra o endereço publicado no Chrome do celular. No menu do navegador, use **Adicionar à tela inicial** para criar um atalho parecido com aplicativo.
5. Se o navegador continuar mostrando a versão antiga, feche e reabra a página; o service worker desta versão usa um cache novo.

## Importante sobre os dados

- Os dados ficam no armazenamento local do navegador, no aparelho e no endereço do site. Não são enviados para o GitHub nem para um servidor.
- Abrir o mesmo site em outro aparelho/navegador não transfere automaticamente as notas ou os saldos.
- Limpar os dados do navegador, mudar de endereço do site ou perder o aparelho pode apagar os dados locais. Use **Arquivos e cópias → Salvar cópia de segurança (JSON)** regularmente.
- O arquivo Excel é uma fotografia dos dados no momento da exportação. Depois de alterar o site, gere e envie um novo Excel.
- A primeira visita exige conexão para abrir o GitHub Pages. O cache offline costuma funcionar depois que o site já foi carregado uma vez.

## Sobre o cadastro de produtos

Esta versão inclui os preços da tabela original e o complemento de 14/10/2026. Produtos de madeira cotados por metro linear usam campos de quantidade e comprimento individual. Tábuas anotadas por m² permitem informar comprimento e largura. Telha (R$ 950,00 por milheiro) e tijolo (R$ 1.200,00 por milheiro) já estão configurados para receber a quantidade em unidades: 800 telhas, por exemplo, custam R$ 760,00. O tipo de tijolo ainda precisa ser identificado. Areia, brita, cal, cimento, madeirite e algumas anotações de forro/Muiracatiara permanecem como **unidade a confirmar** onde a tabela não especificou a forma de cobrança. Abra **Preços → Editar** para confirmar unidade, modo de cobrança e observações antes de lançar esses itens numa nota.

Os valores transcritos das tábuas de pinus preservam as medidas 20, 25 e 30 exatamente como anotadas; não foi atribuída uma unidade de medida a esses números.

Alguns registros antigos foram mantidos separados dos novos quando as descrições ou unidades não deixam claro que se trata do mesmo item. Por exemplo, o forro de Maçaranduba de R$ 160,00 continua separado do registro de R$ 180,00; ambos ficam bloqueados para cobrança até que a unidade seja confirmada. O mesmo cuidado foi aplicado à anotação antiga de Muiracatiara com medida incerta e ao preço transcrito por m².
