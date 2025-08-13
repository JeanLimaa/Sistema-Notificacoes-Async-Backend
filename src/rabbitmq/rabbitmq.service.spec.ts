import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQService } from './rabbitmq.service';
import { MessageStatus } from '../common/enums/message-status.enum';

describe('RabbitMQService', () => {
    let service: RabbitMQService;
    let channelMock: any;

    beforeEach(async () => {
        channelMock = {
            sendToQueue: jest.fn(),
            assertQueue: jest.fn(),
            consume: jest.fn(),
            ack: jest.fn(),
        };
        const connectionMock = {
            createChannel: jest.fn().mockResolvedValue(channelMock),
        };
        jest.spyOn(require('amqplib'), 'connect').mockResolvedValue(connectionMock);

        const module: TestingModule = await Test.createTestingModule({
            providers: [RabbitMQService],
        }).compile();
        service = module.get<RabbitMQService>(RabbitMQService);
        // Simula onModuleInit manualmente
        await service.onModuleInit();
        service['channel'] = channelMock;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should publish message to input queue', async () => {
        await service.publishToInput('id123', 'Test message');
        expect(channelMock.sendToQueue).toHaveBeenCalledWith(
            'fila.notificacao.entrada.jean',
            Buffer.from(JSON.stringify({ messageId: 'id123', messageContent: 'Test message' })),
            { persistent: true }
        );
    });

    it('should set and get status correctly', async () => {
        // Simula publicação de status
        await service['publishToStatus']('id123', MessageStatus.PROCESSING_SUCCESS);
        expect(service.getStatus('id123')).toBe(MessageStatus.PROCESSING_SUCCESS);
    });

    it('should publish message to status queue', async () => {
        await service['publishToStatus']('id456', MessageStatus.PROCESSING_FAILURE);
        expect(channelMock.sendToQueue).toHaveBeenCalledWith(
            'fila.notificacao.status.jean',
            Buffer.from(JSON.stringify({ messageId: 'id456', status: MessageStatus.PROCESSING_FAILURE })),
            { persistent: true }
        );
        expect(service.getStatus('id456')).toBe(MessageStatus.PROCESSING_FAILURE);
    });

    it('should throw error if sendToQueue fails', async () => {
        channelMock.sendToQueue.mockImplementation(() => { throw new Error('Failed to send'); });
        await expect(service.publishToInput('id789', 'Fail message')).rejects.toThrow('Falha ao publicar na fila de entrada');
    });
});
