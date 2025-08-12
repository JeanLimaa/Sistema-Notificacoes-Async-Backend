import { Module } from '@nestjs/common';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    })
  ],
})
export class AppModule { }
