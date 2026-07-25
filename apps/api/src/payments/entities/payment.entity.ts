import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Plan } from '../../plans/entities/plan.entity';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserSubscription, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: UserSubscription;

  @Column({ name: 'subscription_id', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => Plan, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ name: 'plan_id', nullable: true })
  planId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column()
  gateway: string; // 'STRIPE' | 'RAZORPAY'

  @Column({ name: 'gateway_payment_id', nullable: true })
  gatewayPaymentId?: string;

  @Column({ name: 'gateway_order_id', nullable: true })
  gatewayOrderId?: string;

  @Column({ name: 'gateway_signature', nullable: true })
  gatewaySignature?: string;

  @Column({
    name: 'refunded_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  refundedAmount: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
