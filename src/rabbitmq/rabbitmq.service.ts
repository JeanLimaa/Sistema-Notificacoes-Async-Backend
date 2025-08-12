import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { MessageStatus } from '../common/enums/message-status.enum';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQService.name);

  private connection: amqp.Connection;
  private channel: amqp.Channel;

  private readonly inputQueue = 'fila.notificacao.entrada.jean';
  private readonly statusQueue = 'fila.notificacao.status.jean';

  private readonly statusMap = new Map<string, string>();

  async onModuleInit() {
    this.logger.log('Iniciando conexão com o RabbitMQ...');
    
    this.connection = await amqp.connect({
      protocol: 'amqps',
      hostname: process.env.RABBITMQ_HOST,
      port: parseInt(process.env.RABBITMQ_PORT) || 5671,
      username: process.env.RABBITMQ_USER,
      password: process.env.RABBITMQ_PASS,
      vhost: process.env.RABBITMQ_VHOST,
    });

    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.inputQueue, { durable: true });
    await this.channel.assertQueue(this.statusQueue, { durable: true });

    this.consumeInput();

    this.logger.log('RabbitMQ conectado e filas declaradas.');
  }

  public async publishToInput(messageId: string, messageContent: string) {
    const payload = JSON.stringify({ messageId, messageContent });

    this.logger.log(`Publicando na fila de entrada: ${messageId}`);

    await this.channel.sendToQueue(this.inputQueue, Buffer.from(payload), { persistent: true });
  }

  public getStatus(messageId: string): string | undefined {
    return this.statusMap.get(messageId);
  }


  private async publishToStatus(messageId: string, status: string) {
    const payload = JSON.stringify({ messageId, status });

    this.logger.log(`Publicando status: ${messageId} -> ${status}`);

    await this.channel.sendToQueue(this.statusQueue, Buffer.from(payload), { persistent: true });
    this.statusMap.set(messageId, status);
  }

  private async consumeInput() {
    this.channel.consume(this.inputQueue, async (msg) => {
      if (msg) {
        const { messageId } = JSON.parse(msg.content.toString());

        this.logger.log(`Mensagem recebida para processamento: ${messageId}`);

        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        const random = Math.floor(Math.random() * 10) + 1;
        const status = random <= 2 ? MessageStatus.PROCESSING_FAILURE : MessageStatus.PROCESSING_SUCCESS;

        await this.publishToStatus(messageId, status);

        this.channel.ack(msg);
      }
    });
  }
}