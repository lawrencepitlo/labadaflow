import { getBoardOrders } from '@/lib/data/orders'
import { BoardView } from './board-view'

export const metadata = {
  title: 'Operations Board | LabadaFlow',
  description: 'Kanban board for tracking and advancing active laundry orders.',
}

export default async function BoardPage() {
  const orders = await getBoardOrders()

  return <BoardView initialOrders={orders} />
}
