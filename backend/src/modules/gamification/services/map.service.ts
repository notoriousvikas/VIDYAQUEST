import { Types } from 'mongoose';
import { AppError } from '../../../middleware/errorHandler';
import { GameNodeModel, IGameNode } from '../models/GameNode.model';
import { GameWorldModel, IGameWorld } from '../models/GameWorld.model';
import { xpService } from './xp.service';

export interface WorldNodeView {
  id: string;
  slug: string;
  title: string;
  type: IGameNode['type'];
  order: number;
  xpReward: number;
  status: 'locked' | 'unlocked' | 'completed';
}

export interface WorldMapView {
  world: {
    id: string;
    slug: string;
    title: string;
    description: string;
    subject: string;
  };
  nodes: WorldNodeView[];
}

/**
 * Service managing game worlds, learning nodes, and player progression along the map.
 */
export class MapService {
  async listPublishedWorlds() {
    return GameWorldModel.find({ isPublished: true }).sort({ order: 1 }).lean();
  }

  async getWorldMapForPlayer(worldId: string, userId: string): Promise<WorldMapView> {
    const world = await GameWorldModel.findById(worldId).lean();
    if (!world || !world.isPublished) {
      throw new AppError('Game world not found', 404, 'WORLD_NOT_FOUND');
    }

    const [nodes, progress] = await Promise.all([
      GameNodeModel.find({ worldId: new Types.ObjectId(worldId), isPublished: true })
        .sort({ order: 1 })
        .lean(),
      xpService.getOrCreateProgress(userId),
    ]);

    const completedSet = new Set(progress.completedNodeIds.map((id) => id.toString()));
    const unlockedSet = new Set(progress.unlockedNodeIds.map((id) => id.toString()));

    const mappedNodes: WorldNodeView[] = nodes.map((node) => {
      const nodeIdStr = node._id.toString();
      const prereqsMet = node.prerequisiteNodeIds.every((prereqId: Types.ObjectId) =>
        completedSet.has(prereqId.toString()),
      );

      let status: WorldNodeView['status'] = 'locked';
      if (completedSet.has(nodeIdStr)) {
        status = 'completed';
      } else if (unlockedSet.has(nodeIdStr) || prereqsMet) {
        status = 'unlocked';
      }

      return {
        id: nodeIdStr,
        slug: node.slug,
        title: node.title,
        type: node.type,
        order: node.order,
        xpReward: node.xpReward,
        status,
      };
    });

    return {
      world: {
        id: world._id.toString(),
        slug: world.slug,
        title: world.title,
        description: world.description,
        subject: world.subject,
      },
      nodes: mappedNodes,
    };
  }

  async completeNode(nodeId: string, userId: string) {
    const node = await GameNodeModel.findById(nodeId).lean();
    if (!node || !node.isPublished) {
      throw new AppError('Game node not found', 404, 'NODE_NOT_FOUND');
    }

    const progress = await xpService.getOrCreateProgress(userId);
    const completedSet = new Set(progress.completedNodeIds.map((id) => id.toString()));

    if (completedSet.has(nodeId)) {
      return { alreadyCompleted: true, xpAwarded: 0, level: progress.level, totalXp: progress.totalXp };
    }

    const prereqsMet = node.prerequisiteNodeIds.every((prereqId: Types.ObjectId) =>
      completedSet.has(prereqId.toString()),
    );
    if (!prereqsMet) {
      throw new AppError('Node prerequisites not completed', 400, 'PREREQUISITES_NOT_MET');
    }

    progress.completedNodeIds.push(new Types.ObjectId(nodeId));
    await progress.save();

    const awardResult = await xpService.awardXp({
      userId,
      amount: node.xpReward,
      sourceType: 'node_completion',
      sourceId: nodeId,
      description: `Completed node: ${node.title}`,
    });

    return {
      alreadyCompleted: false,
      xpAwarded: awardResult.xpAwarded,
      leveledUp: awardResult.leveledUp,
      level: awardResult.progress.level,
      totalXp: awardResult.progress.totalXp,
    };
  }
}

export const mapService = new MapService();
