import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
// import { AppController } from "./app.controller"
// import { AppService } from "./app.service"
import { WebRtcGateway } from "./webrtc/webrtc.gateway"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    })
  ],
  controllers: [],
  providers: [WebRtcGateway]
})
export class AppModule {}
