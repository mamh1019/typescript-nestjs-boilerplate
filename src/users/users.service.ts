import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../adapters/redis/redis.service';
import { KafkaService } from '../adapters/kafka/kafka.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const USER_CACHE_TTL_SEC = 60;
const userCacheKey = (userId: number) => `user:${userId}`;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redis: RedisService,
    private readonly kafka: KafkaService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ order: { userId: 'ASC' } });
  }

  async findOne(userId: number): Promise<User | null> {
    const key = userCacheKey(userId);
    const cached = await this.redis.get(key);
    if (cached != null) {
      return JSON.parse(cached) as User;
    }
    const user = await this.userRepository.findOne({ where: { userId } });
    if (user != null) {
      await this.redis.set(key, JSON.stringify(user), USER_CACHE_TTL_SEC);
    }
    return user;
  }

  /** users + orders left join 조회 */
  async findAllWithOrders(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.orders', 'orders')
      .orderBy('user.userId', 'ASC')
      .addOrderBy('orders.orderId', 'ASC')
      .getMany();
  }

  async findOneWithOrders(userId: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.orders', 'orders')
      .where('user.userId = :userId', { userId })
      .orderBy('orders.orderId', 'ASC')
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create({
      userName: dto.userName,
      coin: dto.coin ?? 0,
      jewel: dto.jewel ?? 0,
    });
    const saved = await this.userRepository.save(user);
    // Fire-and-forget Kafka 이벤트 (에러가 나도 유저 생성은 성공)
    void this.kafka.emitUserCreated(saved);
    return saved;
  }

  async update(userId: number, dto: UpdateUserDto): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) return null;
    if (dto.userName !== undefined) user.userName = dto.userName;
    if (dto.coin !== undefined) user.coin = dto.coin;
    if (dto.jewel !== undefined) user.jewel = dto.jewel;
    const updated = await this.userRepository.save(user);
    await this.redis.del(userCacheKey(userId));
    return updated;
  }
}
