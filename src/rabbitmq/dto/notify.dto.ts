import { IsNotEmpty, IsString } from 'class-validator';

export class NotifyDto {
    @IsNotEmpty({ message: 'messageId é obrigatório' })
    @IsString({ message: 'messageId deve ser uma string' })
    messageId: string;

    @IsNotEmpty({ message: 'A mensagem é obrigatória' })
    @IsString({ message: 'A mensagem deve ser uma string' })
    messageContent: string;
}