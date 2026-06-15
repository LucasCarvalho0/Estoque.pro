import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Buscar todos os inventários do dia 12/06/2026 (UTC-3, então 03:00 até 02:59 do dia seguinte)
  const inicio = new Date('2026-06-12T03:00:00.000Z') // 12/06 00:00 BRT
  const fim    = new Date('2026-06-13T03:00:00.000Z') // 13/06 00:00 BRT

  const inventarios = await prisma.inventory.findMany({
    where: {
      iniciadoEm: {
        gte: inicio,
        lt: fim,
      }
    },
    include: {
      items: true,
      user: { select: { nome: true, matricula: true } }
    },
    orderBy: { iniciadoEm: 'asc' }
  })

  console.log(`\n📋 Inventários encontrados no dia 12/06/2026: ${inventarios.length}\n`)

  if (inventarios.length === 0) {
    console.log('Nenhum inventário encontrado nessa data.')
    return
  }

  inventarios.forEach((inv, i) => {
    const label = i === inventarios.length - 1 ? '✅ MANTER (último)' : '🗑️  EXCLUIR'
    console.log(`${label} | ID: ${inv.id}`)
    console.log(`   Responsável : ${inv.responsavel} (${inv.matricula})`)
    console.log(`   Iniciado em : ${inv.iniciadoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
    console.log(`   Status      : ${inv.status}`)
    console.log(`   Itens       : ${inv.items.length} items`)
    console.log()
  })

  // Separar: o último ficará, os demais serão excluídos
  const ultimo = inventarios[inventarios.length - 1]
  const paraExcluir = inventarios.slice(0, -1)

  if (paraExcluir.length === 0) {
    console.log('Só existe 1 inventário. Nada a excluir.')
    return
  }

  const idsParaExcluir = paraExcluir.map(inv => inv.id)
  console.log(`\n🗑️  Excluindo ${paraExcluir.length} inventário(s): ${idsParaExcluir.join(', ')}`)

  // Primeiro excluir os itens (filhos) antes de excluir os inventários (pais)
  const deletedItems = await prisma.inventoryItem.deleteMany({
    where: { inventoryId: { in: idsParaExcluir } }
  })
  console.log(`   ✅ ${deletedItems.count} item(s) de inventário excluídos`)

  const deletedInventories = await prisma.inventory.deleteMany({
    where: { id: { in: idsParaExcluir } }
  })
  console.log(`   ✅ ${deletedInventories.count} inventário(s) excluídos`)

  console.log(`\n✅ Concluído! Inventário mantido:`)
  console.log(`   ID          : ${ultimo.id}`)
  console.log(`   Responsável : ${ultimo.responsavel}`)
  console.log(`   Iniciado em : ${ultimo.iniciadoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`)
  console.log(`   Status      : ${ultimo.status}`)
  console.log(`   Itens       : ${ultimo.items.length} item(s)\n`)
}

main()
  .catch(e => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
