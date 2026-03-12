import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { KafkaService } from '../adapters/kafka/kafka.service';
import { Order } from './entities/order.entity';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order]), ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, ApiKeyGuard, KafkaService],
})
export class UsersModule {}
