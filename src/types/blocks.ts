export type HoldFor = "Receive" | "Deliver"

export type Block = {
  id: string
  lineId: string
  containerNo: string
  remarks?: string
  isAllowed: boolean
  holdFor: HoldFor
  createdAt: string
  allowDate?: string | null

  line?: {
    name?: string
  }

  createdByUser?: {
    username?: string
  }

  amendedByUser?: {
    username?: string
  }
}

export type BlockInput = {
  yard: string
  line: string
  holdFor: HoldFor
  containerNo: string
  remarks?: string
}