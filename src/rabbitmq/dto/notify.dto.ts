import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class NotifyDto {
    @IsNotEmpty({ message: 'messageId é obrigatório' })
    @IsUUID('4', { message: 'messageId deve ser um UUID válido' })
    messageId: string;

    @IsNotEmpty({ message: 'A mensagem é obrigatória' })
    @IsString({ message: 'A mensagem deve ser uma string' })
    messageContent: string;
}