import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class KafkaService implements OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly producer: Producer;
  private connected = false;
  private readonly userCreatedTopic = 'user.created';

  constructor(private readonly config: ConfigService) {
    const broker = this.config.get<string>('kafka_broker', 'localhost:9092');
    const kafka = new Kafka({
      clientId: 'users-service',
      brokers: [broker],
    });
    this.producer = kafka.producer();
  }

  private async connectIfNeeded() {
    if (this.connected) return;
    try {
      await this.producer.connect();
      this.connected = true;
    } catch (err) {
      this.logger.error('Failed to connect Kafka producer', err as Error);
    }
  }

  async emitUserCreated(user: User): Promise<void> {
    try {
      await this.connectIfNeeded();
      if (!this.connected) return;

      await this.producer.send({
        topic: this.userCreatedTopic,
        messages: [
          {
            key: String(user.userId),
            value: JSON.stringify({
              userId: user.userId,
              userName: user.userName,
            }),
          },
        ],
      });
    } catch (err) {
      this.logger.error('Failed to emit user.created event', err as Error);
    }
  }

  async onModuleDestroy() {
    if (!this.connected) return;
    try {
      await this.producer.disconnect();
    } catch {
      // ignore
    }
  }
}
