import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { NotifyDto } from './dto/notify.dto';
import { MessageStatus } from '../common/enums/message-status.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class RabbitMQController {
  constructor(
    private readonly rabbitMQService: RabbitMQService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enviar notificação' })
  @ApiBody({ type: NotifyDto })
  @ApiResponse({ status: 202, description: 'Notificação aceita para processamento' })
  @ApiResponse({ status: 400, description: 'Conteúdo da mensagem inválido' })
  @HttpCode(HttpStatus.ACCEPTED)
  async notify(@Body() body: NotifyDto) {
    await this.rabbitMQService.publishToInput(body.messageId, body.messageContent);

    return {
      messageId: body.messageId,
      status: MessageStatus.WAITING_PROCESSING,
    };
  }

  @Get('status/:messageId')
  @ApiOperation({ summary: 'Obter status de notificação' })
  @ApiParam({ name: 'messageId', description: 'ID da mensagem de notificação' })
  @ApiResponse({ status: 200, description: 'Retorna o status da notificação' })
  @ApiResponse({ status: 404, description: 'Mensagem de notificação não encontrada' })
  @HttpCode(HttpStatus.OK)
  getStatus(@Param('messageId') messageId: string) {
    const status = this.rabbitMQService.getStatus(messageId);
    
    if (!status) {
      throw new NotFoundException({
        messageId,
        status: MessageStatus.NOT_FOUND,
      });
    }

    return { messageId, status };
  }
}
