import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed VPC...");
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await prisma.user.upsert({
    where: { matricula: "0001" }, 
    update: { senha: await hash("admin123") },
    create: { matricula: "0001", nome: "Administrador", email: "admin@vpc.com", senha: await hash("admin123"), role: UserRole.ADMINISTRADOR },
  });
  await prisma.user.upsert({
    where: { matricula: "0002" }, 
    update: { senha: await hash("senha123") },
    create: { matricula: "0002", nome: "Lider de Estoque", email: "lider@vpc.com", senha: await hash("senha123"), role: UserRole.LIDER },
  });
  await prisma.user.upsert({
    where: { matricula: "116911" }, 
    update: { senha: await hash("116911") },
    create: { matricula: "116911", nome: "Eduardo Adão", email: "eduardo.adao@vpc.com", senha: await hash("116911"), role: UserRole.ESTOQUISTA },
  });
  await prisma.user.upsert({
    where: { matricula: "116221" }, 
    update: { senha: await hash("116221") },
    create: { matricula: "116221", nome: "Lucas Carvalho", email: "lucas@vpc.com", senha: await hash("116221"), role: UserRole.ADMINISTRADOR },
  });
  console.log("✓ Usuarios criados");

  const fornecedorVPC = await prisma.supplier.upsert({
    where: { cnpj: "00.000.000/0001-00" }, update: {},
    create: { nome: "VPC Acessorios", cnpj: "00.000.000/0001-00", email: "contato@vpc.com", telefone: "(41) 3333-0000" },
  });
  console.log("✓ Fornecedor criado");

  const clienteNomes = ["BARIGUI", "FROTA", "LOCALIZA", "LOCACOES AMERICANAS", "MOVIDA", "MOVIDA GTF", "MOVIDA RAC", "MOVIDA ZERO KM", "NISSAN", "SESE", "UNIDAS"];
  const clienteMap: Record<string, string> = {};
  for (const nome of clienteNomes) {
    const c = await prisma.cliente.upsert({ where: { nome }, update: {}, create: { nome } });
    clienteMap[nome] = c.id;
  }
  // Also store original names from spreadsheet
  clienteMap["LOCACOES AMERICANAS"] = clienteMap["LOCACOES AMERICANAS"];
  console.log("✓ Clientes criados:", clienteNomes.length);

  type ProdutoRow = { codigo: string; nome: string; modelo: string; clienteNome: string; quantidade: number };
  const produtos: ProdutoRow[] = [
    { codigo: "BRG01", nome: "Camera de Re / Tartaruga", modelo: "-", clienteNome: "BARIGUI", quantidade: 0 },
    { codigo: "BRPRT 11255", nome: "Capota Maritima", modelo: "Frontier", clienteNome: "FROTA", quantidade: 1 },
    { codigo: "BRPRT 11357", nome: "Protetor de Cacamba", modelo: "Frontier", clienteNome: "FROTA", quantidade: 0 },
    { codigo: "BRPRT 11156", nome: "Protetor de Carter", modelo: "Kicks", clienteNome: "FROTA", quantidade: 0 },
    { codigo: "BRPRT 11359", nome: "Rolo Insulfilm", modelo: "-", clienteNome: "FROTA", quantidade: 9 },
    { codigo: "BRPRT 11355", nome: "Trava de Estepe", modelo: "Frontier", clienteNome: "FROTA", quantidade: 4 },
    { codigo: "BRPRT 11354", nome: "Trava Rodas", modelo: "-", clienteNome: "FROTA", quantidade: 7 },
    { codigo: "BRPRT 11208", nome: "Capota Maritima Frontier", modelo: "Frontier", clienteNome: "FROTA", quantidade: 0 },
    { codigo: "T99E25MP0A", nome: "Tapete Ariya", modelo: "Ariya", clienteNome: "FROTA", quantidade: 0 },
    { codigo: "LOCAM4", nome: "Bandeirola", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM7", nome: "Faixa Lado Direito", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM6", nome: "Faixa Lado Esquerdo", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM9", nome: "Forracao Assoalho", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM8", nome: "Forracao dos Bancos", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM5", nome: "Giroflex", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM1", nome: "Protetor de Cacamba LOCAM", modelo: "Frontier", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM2", nome: "Santo Antonio", modelo: "Frontier", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOCAM3", nome: "Sirene Re", modelo: "-", clienteNome: "LOCACOES AMERICANAS", quantidade: 0 },
    { codigo: "LOC01", nome: "Apoio de Braco", modelo: "Kicks", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC02", nome: "Camera de Re", modelo: "-", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC03", nome: "Capota de Fibra", modelo: "Frontier", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC04", nome: "Chicote de Re", modelo: "-", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC05", nome: "Engate", modelo: "-", clienteNome: "LOCALIZA", quantidade: 8 },
    { codigo: "LOC06", nome: "Etiqueta Decalque", modelo: "-", clienteNome: "LOCALIZA", quantidade: 18 },
    { codigo: "LOC07", nome: "Modulo Engate", modelo: "-", clienteNome: "LOCALIZA", quantidade: 8 },
    { codigo: "LOC08", nome: "Protetor de Cacamba LOC", modelo: "Frontier", clienteNome: "LOCALIZA", quantidade: 8 },
    { codigo: "LOC09", nome: "Protetor de Carter LOC", modelo: "Kicks", clienteNome: "LOCALIZA", quantidade: 150 },
    { codigo: "LOC010", nome: "Sensor de Re", modelo: "-", clienteNome: "LOCALIZA", quantidade: 46 },
    { codigo: "LOC012", nome: "Sirene", modelo: "-", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC013", nome: "Tapete Porta-Malas", modelo: "-", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC014", nome: "Trava de Estepe LOC", modelo: "Frontier", clienteNome: "LOCALIZA", quantidade: 5 },
    { codigo: "LOC015", nome: "Santo Antonio LOC", modelo: "Frontier", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC016", nome: "Capota Maritima LOC", modelo: "Frontier", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC017", nome: "Cofre Novo Kicks", modelo: "Novo Kicks", clienteNome: "LOCALIZA", quantidade: 551 },
    { codigo: "LOC018", nome: "Cofre Kicks Play", modelo: "Kicks Play", clienteNome: "LOCALIZA", quantidade: 0 },
    { codigo: "LOC019", nome: "Adesivo Gasolina", modelo: "Sentra", clienteNome: "LOCALIZA", quantidade: 519 },
    { codigo: "MOV01", nome: "Bagagito", modelo: "Kicks", clienteNome: "MOVIDA", quantidade: 1 },
    { codigo: "MOV02", nome: "Protetor de Cacamba MOV", modelo: "Frontier", clienteNome: "MOVIDA", quantidade: 0 },
    { codigo: "MOV03", nome: "Protetor de Carter MOV", modelo: "-", clienteNome: "MOVIDA", quantidade: 48 },
    { codigo: "MOV04", nome: "Adesivo QR Code", modelo: "-", clienteNome: "MOVIDA GTF", quantidade: 1900 },
    { codigo: "MOV14", nome: "Manual do Condutor", modelo: "-", clienteNome: "MOVIDA GTF", quantidade: 900 },
    { codigo: "MOV05", nome: "Adesivo I RAC", modelo: "-", clienteNome: "MOVIDA RAC", quantidade: 4094 },
    { codigo: "MOV06", nome: "Adesivo Para Brisa RAC", modelo: "-", clienteNome: "MOVIDA RAC", quantidade: 2162 },
    { codigo: "MOV07", nome: "Chaveiro RAC", modelo: "-", clienteNome: "MOVIDA RAC", quantidade: 736 },
    { codigo: "MOV08", nome: "Lixeira RAC", modelo: "-", clienteNome: "MOVIDA RAC", quantidade: 4600 },
    { codigo: "MOV09", nome: "Porta Documento RAC", modelo: "-", clienteNome: "MOVIDA RAC", quantidade: 1427 },
    { codigo: "MOV10", nome: "Adesivo I ZERO KM", modelo: "-", clienteNome: "MOVIDA ZERO KM", quantidade: 7585 },
    { codigo: "MOV11", nome: "Adesivo Para Brisa ZERO KM", modelo: "-", clienteNome: "MOVIDA ZERO KM", quantidade: 3418 },
    { codigo: "MOV12", nome: "Etiqueta Decalque ZERO KM", modelo: "-", clienteNome: "MOVIDA ZERO KM", quantidade: 0 },
    { codigo: "MOV13", nome: "Lixeira ZERO KM", modelo: "-", clienteNome: "MOVIDA ZERO KM", quantidade: 920 },
    { codigo: "BRPRT 70262", nome: "Adaptador Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 2 },
    { codigo: "BRPRT 11403", nome: "Adesivo Coluna C Direita", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 251 },
    { codigo: "BRPRT 11409", nome: "Adesivo Coluna C Esquerda", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 167 },
    { codigo: "99098xA0A", nome: "Adesivo L/D C PILLAR", modelo: "Prototipo", clienteNome: "NISSAN", quantidade: 950 },
    { codigo: "99099xA0A", nome: "Adesivo L/E C PILLAR", modelo: "Prototipo", clienteNome: "NISSAN", quantidade: 800 },
    { codigo: "BRPRT 11552", nome: "Adesivo Prata 220T", modelo: "220T", clienteNome: "NISSAN", quantidade: 1500 },
    { codigo: "BRPRT 11551", nome: "Adesivo Preto 220T", modelo: "220T", clienteNome: "NISSAN", quantidade: 3500 },
    { codigo: "BRPRT 11404", nome: "Adesivo X Play P/mala", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 68 },
    { codigo: "BRPRT 11130", nome: "Aplique Grade Frontal TAG", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 30 },
    { codigo: "NISS06", nome: "Cabo Adaptador Ariya", modelo: "Ariya", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11259", nome: "Carregador Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 458 },
    { codigo: "BRPRT 11273", nome: "Carregador sem fio MY24", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 9 },
    { codigo: "BRPRT 11273 NG", nome: "Carregador sem fio MY24 NG", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 3 },
    { codigo: "NISS01", nome: "Etiqueta Bateria Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 70270", nome: "Etiqueta carregador advert", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 70229", nome: "Etiqueta Inmetro", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 70227", nome: "Etiqueta Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BR01031578L", nome: "Etiqueta Verde (Rotulagem)", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "NISS02", nome: "Guia Rapido Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11131", nome: "Inserto Volante", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 35 },
    { codigo: "BRPRT 11562", nome: "Jogo Friso Lateral Vermelho", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 4 },
    { codigo: "63810-6MV0C", nome: "Kit Fixacao Frontier", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 84 },
    { codigo: "BRPRT 50234", nome: "Kit Manual Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11555", nome: "Kit Soleira - Kicks", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 1 },
    { codigo: "BRPRT 11555 NG", nome: "Kit Soleira - Kicks NG", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 2 },
    { codigo: "NISS03", nome: "Manual Carregador Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 70263", nome: "Mochila Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "63810-6MV0A", nome: "Para-Choque Direito", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 61 },
    { codigo: "63810-6MV0A NG", nome: "Para-Choque Direito NG", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 2 },
    { codigo: "63811-6MV0A", nome: "Para-Choque Esquerdo", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 63 },
    { codigo: "63811-6MV0A NG", nome: "Para-Choque Esquerdo NG", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 2 },
    { codigo: "63810-6MV0B", nome: "Para-Lama Dianteiro Direito", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 11 },
    { codigo: "63811-6MV0B", nome: "Para-Lama Dianteiro Esquerdo", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 14 },
    { codigo: "63811-6MV0B NG", nome: "Para-Lama Dianteiro Esquerdo NG", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 1 },
    { codigo: "93828-6MV0A", nome: "Para-Lama Traseiro Direito", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 12 },
    { codigo: "93828-6MV0A NG", nome: "Para-Lama Traseiro Direito NG", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 2 },
    { codigo: "93829-6MV0A", nome: "Para-Lama Traseiro Esquerdo", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 24 },
    { codigo: "93829-6MV0A NG", nome: "Para-Lama Traseiro Esquerdo NG", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "990795JJ0A", nome: "Placa Ano de Fabricacao", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11588", nome: "Ponteira Kicks", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 4 },
    { codigo: "NISS04", nome: "Prisma Kicks", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "FRONTIER", nome: "Prisma Frontier", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 1800 },
    { codigo: "NISS05", nome: "Prisma Versa", modelo: "Versa", clienteNome: "NISSAN", quantidade: 200 },
    { codigo: "k000453", nome: "Soleira X-Play", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 47 },
    { codigo: "KE7455500B", nome: "Tapete Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11055", nome: "Tapete Carpete Versa", modelo: "Versa", clienteNome: "NISSAN", quantidade: 273 },
    { codigo: "BRPRT 10753", nome: "Tapete Frontier", modelo: "Frontier", clienteNome: "NISSAN", quantidade: 140 },
    { codigo: "BRPRT 10947", nome: "Tapete PVC Versa", modelo: "Versa", clienteNome: "NISSAN", quantidade: 464 },
    { codigo: "BRPRT 11326", nome: "Tapete Sentra", modelo: "Sentra", clienteNome: "NISSAN", quantidade: 14 },
    { codigo: "BRPRT 11325", nome: "Tapete X-PLAY", modelo: "Kicks", clienteNome: "NISSAN", quantidade: 36 },
    { codigo: "BRPRT 70257", nome: "Triangulo Leaf", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 334 },
    { codigo: "990799LH1A", nome: "Vin Label LH", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "R100362098", nome: "Vin Label R", modelo: "Leaf", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11605", nome: "KIT Chicote Multimidia c/ botao", modelo: "Kait", clienteNome: "NISSAN", quantidade: 872 },
    { codigo: "BRPRT 11604", nome: "KIT Chicote Multimidia s/ botao", modelo: "Kait", clienteNome: "NISSAN", quantidade: 1165 },
    { codigo: "BRPRT 11607", nome: "Moldura Multimidia c/ botao", modelo: "Kait", clienteNome: "NISSAN", quantidade: 1105 },
    { codigo: "BRPRT 11608", nome: "Moldura Multimidia s/ botao", modelo: "Kait", clienteNome: "NISSAN", quantidade: 1114 },
    { codigo: "BRPRT 3110100001", nome: "Moldura Traseira Kait", modelo: "Kait", clienteNome: "NISSAN", quantidade: 2175 },
    { codigo: "BRPRT 11603", nome: "Multimidia Pionner", modelo: "Kait", clienteNome: "NISSAN", quantidade: 1508 },
    { codigo: "99098xA0A NG", nome: "Adesivo L/D C PILLAR NG", modelo: "Prototipo", clienteNome: "NISSAN", quantidade: 5 },
    { codigo: "99099xA0A NG", nome: "Adesivo L/E C PILLAR NG", modelo: "Prototipo", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "NISSAN004", nome: "Adesivo test drive", modelo: "Kait", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT11609", nome: "Tampa USB", modelo: "Kait", clienteNome: "NISSAN", quantidade: 2018 },
    { codigo: "K000665", nome: "KIT SOLEIRA P02H", modelo: "Kait", clienteNome: "NISSAN", quantidade: 16 },
    { codigo: "TEST002", nome: "Adesivo test drive 2", modelo: "Kait", clienteNome: "NISSAN", quantidade: 20 },
    { codigo: "BRPRT 11591", nome: "Aerofolio branco", modelo: "Kait", clienteNome: "NISSAN", quantidade: 1 },
    { codigo: "BRPRT 11605 NG", nome: "KIT Chicote Multimidia c/ botao NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 36 },
    { codigo: "BRPRT 11604 NG", nome: "KIT Chicote Multimidia s/ botao NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 59 },
    { codigo: "BRPRT 11566", nome: "Jogo de Friso Branco", modelo: "Kait", clienteNome: "NISSAN", quantidade: 37 },
    { codigo: "EL300BT", nome: "Leitor Elgin Sem Fio", modelo: "-", clienteNome: "NISSAN", quantidade: 14 },
    { codigo: "BRPRT 11607 NG", nome: "Moldura Multimidia c/ botao NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 57 },
    { codigo: "BRPRT 11608 NG", nome: "Moldura Multimidia s/ botao NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 14 },
    { codigo: "BRPRT 3110100001 NG", nome: "Moldura Traseira NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 16 },
    { codigo: "BRPRT 11603 NG", nome: "Multimidia Pionner NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 18 },
    { codigo: "NISSAN004 NG", nome: "Adesivo test drive NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT11609 NG", nome: "Tampa USB NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "K000665 NG", nome: "KIT SOLEIRA P02H NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "TEST002 NG", nome: "Adesivo test drive 2 NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "BRPRT 11591 NG", nome: "Aerofolio branco NG", modelo: "Kait", clienteNome: "NISSAN", quantidade: 0 },
    { codigo: "SESE01", nome: "Insulfilm Frontier", modelo: "Frontier", clienteNome: "SESE", quantidade: 10 },
    { codigo: "SESE02", nome: "Insulfilm Kicks", modelo: "Kicks", clienteNome: "SESE", quantidade: 10 },
    { codigo: "SESE03", nome: "Insulfilm Sentra", modelo: "Sentra", clienteNome: "SESE", quantidade: 35 },
    { codigo: "SESE04", nome: "Insulfilm Versa", modelo: "Versa", clienteNome: "SESE", quantidade: 0 },
    { codigo: "SESE05", nome: "Insulfilm P16", modelo: "Kicks", clienteNome: "SESE", quantidade: 10 },
    { codigo: "SESE06", nome: "Insulfilm Antivandalismo Kicks Play", modelo: "Kicks Play", clienteNome: "SESE", quantidade: 3 },
    { codigo: "SESE07", nome: "Insulfilm Antivandalismo Sentra", modelo: "Sentra", clienteNome: "SESE", quantidade: 1 },
    { codigo: "SESE08", nome: "Insulfilm Antivandalismo Versa", modelo: "Versa", clienteNome: "SESE", quantidade: 6 },
    { codigo: "SESE09", nome: "Insulfilm Antivandalismo P16", modelo: "P16", clienteNome: "SESE", quantidade: 7 },
    { codigo: "SESE10", nome: "Detergente Ype", modelo: "-", clienteNome: "SESE", quantidade: 4 },
    { codigo: "SESE11", nome: "Shampoo Johnson", modelo: "-", clienteNome: "SESE", quantidade: 8 },
    { codigo: "UNI01", nome: "Chaveiro UNIDAS", modelo: "-", clienteNome: "UNIDAS", quantidade: 225 },
    { codigo: "UNI02", nome: "Lixeira UNIDAS", modelo: "-", clienteNome: "UNIDAS", quantidade: 241 },
    { codigo: "UNI03", nome: "Porta Documento UNIDAS", modelo: "-", clienteNome: "UNIDAS", quantidade: 230 },
    { codigo: "UNI04", nome: "Porta Manual UNIDAS", modelo: "-", clienteNome: "UNIDAS", quantidade: 233 },
    { codigo: "UNI05", nome: "Sensor de Re UNIDAS", modelo: "-", clienteNome: "UNIDAS", quantidade: 1 },
    { codigo: "UNI06", nome: "Bagagito Kicks UNIDAS", modelo: "Kicks", clienteNome: "UNIDAS", quantidade: 0 },
  ];

  let criados = 0;
  for (const p of produtos) {
    const clienteId = clienteMap[p.clienteNome] ?? null;
    await prisma.product.upsert({
      where: { codigo: p.codigo },
      update: { quantidade: p.quantidade, clienteId, modelo: p.modelo },
      create: {
        codigo: p.codigo, nome: p.nome, modelo: p.modelo,
        unidade: "un", quantidade: p.quantidade, quantidadeMinima: 0,
        supplierId: fornecedorVPC.id, clienteId,
      },
    });
    criados++;
  }
  console.log("✓", criados, "produtos importados da planilha VPC");

  await prisma.log.create({
    data: { action: "LOGIN", descricao: "Banco inicializado com dados VPC", userId: admin.id },
  });

  console.log("\n✅ Seed VPC concluido!");
  console.log("\nCredenciais:");
  console.log("  Admin      → mat: 0001 | senha: admin123");
  console.log("  Lider      → mat: 0002 | senha: senha123");
  console.log("  Estoquista → mat: 4821 | senha: senha123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
