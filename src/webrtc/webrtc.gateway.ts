import {
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets"
import { Socket } from "socket.io"

import { Server } from "ws"
import { Logger } from "@nestjs/common"

@WebSocketGateway({ namespace: "chat", cors: true })
export class WebRtcGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server

  private logger: Logger = new Logger("MessageGateway")

  private data: { [socketId: string]: { id: string; dstSocketId: string | null } } = {}

  @SubscribeMessage("start")
  public start(client: Socket): void {
    const clientId = String(client.id)

    const existingSocket = this.data[clientId]
    if (existingSocket) this.logger.log(`Client ${clientId} already exist`)

    this.data[clientId] = { id: clientId, dstSocketId: null }

    this.logger.log(`Registered client ${clientId}`)

    console.log(1, clientId, this.data)

    const availableUser = Object.values(this.data).find(obj => obj.dstSocketId === null && obj.id !== clientId)
    if (!availableUser) return

    availableUser.dstSocketId = clientId
    this.data[clientId].dstSocketId = availableUser.id

    client.to(availableUser.id).emit("update-destination", {
      user: clientId,
      current: clientId
    })

    client.emit("init-call", {
      user: availableUser.id
    })

    console.log(2, this.data)
  }

  @SubscribeMessage("call-user")
  public callUser(client: Socket, data: any): void {
    client.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: client.id
    })
  }

  @SubscribeMessage("make-answer")
  public makeAnswer(client: Socket, data: any): void {
    client.to(data.to).emit("answer-made", {
      socket: client.id,
      answer: data.answer
    })
  }

  @SubscribeMessage("reject-call")
  public rejectCall(client: Socket, data: any): void {
    client.to(data.from).emit("call-rejected", {
      socket: client.id
    })
  }

  public afterInit() {}

  public handleDisconnect(client: Socket): void {
    const existingSocket = this.data[client.id]
    if (!existingSocket) return

    if (existingSocket.dstSocketId) {
      client.to(existingSocket.dstSocketId).emit(`remove-user`, {
        socketId: client.id
      })
    }

    delete this.data[client.id]
    if (this.data[existingSocket.dstSocketId]) this.data[existingSocket.dstSocketId].dstSocketId = null

    this.logger.log(`Client disconnected: ${client.id}`)
  }
}
