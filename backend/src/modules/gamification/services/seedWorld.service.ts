import { SubjectModel } from '../../catalog/models/Subject.model';
import { MapLocationModel } from '../models/MapLocation.model';
import { MissionModel } from '../models/Mission.model';
import { SubjectMapModel } from '../models/SubjectMap.model';

/**
 * Idempotently seeds (and upgrades) the four core VidyaQuest subject worlds:
 * Chemistry (Alchemy Castle), Physics (Atom Kingdom),
 * Biology (Life Forest), and Mathematics (Number Kingdom).
 * Each subject has exactly 8 strictly sequential levels (1 -> 2 -> ... -> 8).
 */
let seedPromise: Promise<void> | null = null;

export async function seedSubjectWorlds(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const worlds = [
      {
        subject: {
          name: 'Chemistry',
          slug: 'chemistry',
          description: 'Master elements, reactions, acids, bases, and solutions inside Alchemy Castle.',
          icon: 'flask-conical',
          displayOrder: 1,
        },
        map: {
          mapName: 'Knowledge Village',
          mapSlug: 'knowledge-village',
          theme: {
            primaryColor: '#a855f7',
            secondaryColor: '#f59e0b',
            oceanColor: '#1a382c',
            badgeStyle: 'alchemy-purple',
            ambientEffect: 'sparkles',
          },
          backgroundAsset: '/assets/maps/knowledge-village.jpg',
          previewAsset: '/assets/maps/knowledge-village.jpg',
        },
        zones: [
          { slug: 'elements-courtyard', name: 'Village Cottages', x: 20, y: 62, color: '#eab308', desc: 'Discover atoms, symbols, and pure substances.' },
          { slug: 'periodic-hall', name: 'Grand Library', x: 34, y: 24, color: '#22c55e', desc: 'Navigate groups, periods, and element families.' },
          { slug: 'reaction-forge', name: 'Market Square', x: 48, y: 54, color: '#38bdf8', desc: 'Balance chemical equations and reaction types.' },
          { slug: 'acids-bases-lab', name: 'River Bridges', x: 74, y: 74, color: '#f59e0b', desc: 'Test pH scales, indicators, and neutralization.' },
          { slug: 'solutions-spire', name: 'Crystal Spire', x: 86, y: 36, color: '#a855f7', desc: 'Master concentration, solubility, and mixtures.' },
        ],
        missions: [
          { slug: 'chem-1', zone: 'elements-courtyard', title: 'Properties of Acids & Bases', type: 'Virtual experiment', diff: 'Beginner', xp: 50, x: 22, y: 74, prereq: null, obj: ['Test litmus and pH indicators on acids and bases', 'Classify solutions by pH value'] },
          { slug: 'chem-2', zone: 'elements-courtyard', title: 'Acid-Base Titration Lab', type: 'Virtual experiment', diff: 'Beginner', xp: 75, x: 16, y: 48, prereq: 'chem-1', obj: ['Perform controlled burette titration', 'Detect the neutralization endpoint using indicators'] },
          { slug: 'chem-3', zone: 'periodic-hall', title: 'Periodic Patterns', type: 'Puzzle', diff: 'Intermediate', xp: 100, x: 18, y: 22, prereq: 'chem-2', obj: ['Group metals, non-metals, and metalloids'] },
          { slug: 'chem-4', zone: 'periodic-hall', title: 'Chemical Bonding', type: 'Interactive lesson', diff: 'Intermediate', xp: 120, x: 52, y: 20, prereq: 'chem-3', obj: ['Compare ionic and covalent electron sharing'] },
          { slug: 'chem-5', zone: 'reaction-forge', title: 'Balancing Equations', type: 'Challenge', diff: 'Intermediate', xp: 140, x: 46, y: 54, prereq: 'chem-4', obj: ['Apply conservation of mass to chemical reactions'] },
          { slug: 'chem-6', zone: 'acids-bases-lab', title: 'pH Indicator Quest', type: 'Virtual experiment', diff: 'Intermediate', xp: 160, x: 64, y: 72, prereq: 'chem-5', obj: ['Classify acids and bases using litmus and pH'] },
          { slug: 'chem-7', zone: 'solutions-spire', title: 'Solution Molarity Lab', type: 'Virtual experiment', diff: 'Advanced', xp: 200, x: 84, y: 78, prereq: 'chem-6', obj: ['Calculate concentration and dilution of solutions'] },
          { slug: 'chem-8', zone: 'solutions-spire', title: 'Grand Elixir Trial', type: 'Project', diff: 'Master', xp: 250, x: 86, y: 46, prereq: 'chem-7', obj: ['Synthesize molarity and neutralization concepts'] },
        ],
      },
      {
        subject: {
          name: 'Physics',
          slug: 'physics',
          description: 'Explore mechanics, electricity, magnetism, optics, and energy in Atom Kingdom.',
          icon: 'atom',
          displayOrder: 2,
        },
        map: {
          mapName: 'Discovery Island',
          mapSlug: 'discovery-island',
          theme: {
            primaryColor: '#38bdf8',
            secondaryColor: '#22c55e',
            oceanColor: '#0c4a6e',
            badgeStyle: 'physics-cyan',
            ambientEffect: 'clouds',
          },
          backgroundAsset: '/assets/maps/discovery-island.jpg',
          previewAsset: '/assets/maps/discovery-island.jpg',
        },
        zones: [
          { slug: 'mechanics-plains', name: 'Explorer Camp', x: 35, y: 66, color: '#eab308', desc: 'Motion, forces, and Newton’s laws.' },
          { slug: 'optics-observatory', name: 'Ancient Ruins', x: 24, y: 34, color: '#22c55e', desc: 'Reflection, refraction, and lenses.' },
          { slug: 'magnetism-peaks', name: 'Palm Crossroads', x: 50, y: 36, color: '#38bdf8', desc: 'Magnetic fields and electromagnetism.' },
          { slug: 'electricity-coast', name: 'Lagoon Cove', x: 64, y: 66, color: '#f59e0b', desc: 'Current, voltage, and circuits.' },
          { slug: 'energy-citadel', name: 'Lighthouse Cliff', x: 82, y: 42, color: '#a855f7', desc: 'Work, power, and energy conservation.' },
        ],
        missions: [
          { slug: 'phys-1', zone: 'mechanics-plains', title: 'Motion & Speed', type: 'Interactive lesson', diff: 'Beginner', xp: 50, x: 42, y: 74, prereq: null, obj: ['Calculate speed from distance and time'] },
          { slug: 'phys-2', zone: 'mechanics-plains', title: 'Balanced Forces', type: 'Virtual experiment', diff: 'Beginner', xp: 75, x: 28, y: 56, prereq: 'phys-1', obj: ['Predict net force on moving objects'] },
          { slug: 'phys-3', zone: 'optics-observatory', title: 'Mirror Maze', type: 'Virtual experiment', diff: 'Intermediate', xp: 100, x: 23, y: 30, prereq: 'phys-2', obj: ['Verify angle of incidence equals angle of reflection'] },
          { slug: 'phys-4', zone: 'optics-observatory', title: 'Refraction & Lenses', type: 'Quiz', diff: 'Intermediate', xp: 120, x: 43, y: 52, prereq: 'phys-3', obj: ['Trace light bending through convex and concave lenses'] },
          { slug: 'phys-5', zone: 'magnetism-peaks', title: 'Magnetic Fields', type: 'Puzzle', diff: 'Intermediate', xp: 140, x: 54, y: 26, prereq: 'phys-4', obj: ['Map field lines around bar magnets'] },
          { slug: 'phys-6', zone: 'electricity-coast', title: 'Ohm’s Law Bridge', type: 'Virtual experiment', diff: 'Advanced', xp: 170, x: 63, y: 66, prereq: 'phys-5', obj: ['Relate voltage, current, and resistance'] },
          { slug: 'phys-7', zone: 'energy-citadel', title: 'Work & Power Forge', type: 'Interactive lesson', diff: 'Advanced', xp: 210, x: 80, y: 58, prereq: 'phys-6', obj: ['Compute kinetic and potential energy transformations'] },
          { slug: 'phys-8', zone: 'energy-citadel', title: 'Atom King’s Trial', type: 'Challenge', diff: 'Master', xp: 260, x: 84, y: 34, prereq: 'phys-7', obj: ['Solve multi-step conservation of energy challenges'] },
        ],
      },
      {
        subject: {
          name: 'Biology',
          slug: 'biology',
          description: 'Journey through Cell City, DNA Valley, and living ecosystems in Life Forest.',
          icon: 'leaf',
          displayOrder: 3,
        },
        map: {
          mapName: 'Science Forest',
          mapSlug: 'science-forest',
          theme: {
            primaryColor: '#22c55e',
            secondaryColor: '#eab308',
            oceanColor: '#0f2d25',
            badgeStyle: 'bio-emerald',
            ambientEffect: 'leaves',
          },
          backgroundAsset: '/assets/maps/science-forest.jpg',
          previewAsset: '/assets/maps/science-forest.jpg',
        },
        zones: [
          { slug: 'plant-life', name: 'Glowing Grove', x: 22, y: 72, color: '#22c55e', desc: 'Photosynthesis and plant anatomy.' },
          { slug: 'cell-city', name: 'River Bridge', x: 42, y: 44, color: '#10b981', desc: 'Organelles and cellular transport.' },
          { slug: 'dna-valley', name: 'Canopy Lab', x: 62, y: 24, color: '#38bdf8', desc: 'Genetics, heredity, and replication.' },
          { slug: 'ecosystems', name: 'Boardwalk Trail', x: 76, y: 78, color: '#f59e0b', desc: 'Food webs and biodiversity.' },
          { slug: 'human-body', name: 'Botanical Dome', x: 84, y: 48, color: '#ef4444', desc: 'Organ systems and homeostasis.' },
        ],
        missions: [
          { slug: 'bio-1', zone: 'plant-life', title: 'Leaf Peel Stomata Lab', type: 'Virtual experiment', diff: 'Beginner', xp: 50, x: 19, y: 68, prereq: null, obj: ['Prepare a temporary stained leaf peel mount', 'Inspect guard cells and stomatal pores under 3D microscopy'] },
          { slug: 'bio-2', zone: 'plant-life', title: 'Human Heart 3D Model', type: 'Virtual experiment', diff: 'Beginner', xp: 75, x: 26, y: 82, prereq: 'bio-1', obj: ['Identify the four chambers and major vessels of the heart', 'Trace oxygenated and deoxygenated blood flow'] },
          { slug: 'bio-3', zone: 'cell-city', title: 'Organelle Tour', type: 'Quiz', diff: 'Beginner', xp: 95, x: 36, y: 48, prereq: 'bio-2', obj: ['Match cell organelles to their functions'] },
          { slug: 'bio-4', zone: 'cell-city', title: 'Mitosis & Cell Division', type: 'Interactive lesson', diff: 'Intermediate', xp: 120, x: 50, y: 41, prereq: 'bio-3', obj: ['Order the phases of mitotic cell division'] },
          { slug: 'bio-5', zone: 'dna-valley', title: 'Double Helix Code', type: 'Puzzle', diff: 'Intermediate', xp: 145, x: 62, y: 24, prereq: 'bio-4', obj: ['Pair complementary DNA base pairs'] },
          { slug: 'bio-6', zone: 'ecosystems', title: 'Tidepool Food Web', type: 'Virtual experiment', diff: 'Intermediate', xp: 170, x: 76, y: 82, prereq: 'bio-5', obj: ['Balance producer and consumer populations'] },
          { slug: 'bio-7', zone: 'human-body', title: 'Nervous Reflexes', type: 'Quiz', diff: 'Advanced', xp: 200, x: 78, y: 58, prereq: 'bio-6', obj: ['Trace sensory, relay, and motor neuron pathways'] },
          { slug: 'bio-8', zone: 'human-body', title: 'Circulatory Quest', type: 'Challenge', diff: 'Master', xp: 250, x: 86, y: 40, prereq: 'bio-7', obj: ['Trace oxygen flow through heart and lungs'] },
        ],
      },
      {
        subject: {
          name: 'Mathematics',
          slug: 'mathematics',
          description: 'Conquer Algebra City, Geometry Valley, and Number Mountains in Number Kingdom.',
          icon: 'sigma',
          displayOrder: 4,
        },
        map: {
          mapName: 'Math Mountains',
          mapSlug: 'math-mountains',
          theme: {
            primaryColor: '#f59e0b',
            secondaryColor: '#38bdf8',
            oceanColor: '#1b3148',
            badgeStyle: 'math-gold',
            ambientEffect: 'clouds',
          },
          backgroundAsset: '/assets/maps/math-mountains.jpg',
          previewAsset: '/assets/maps/math-mountains.jpg',
        },
        zones: [
          { slug: 'puzzle-village', name: 'Basecamp Plaza', x: 18, y: 66, color: '#eab308', desc: 'Arithmetic, ratios, and logic puzzles.' },
          { slug: 'algebra-city', name: 'Alpine Temple', x: 30, y: 34, color: '#22c55e', desc: 'Expressions, equations, and functions.' },
          { slug: 'number-mountains', name: 'Crystal Ridge', x: 58, y: 48, color: '#38bdf8', desc: 'Prime numbers, exponents, and sequences.' },
          { slug: 'geometry-valley', name: 'Gorge Crossing', x: 78, y: 70, color: '#f59e0b', desc: 'Triangles, circles, and coordinate planes.' },
          { slug: 'theorem-keep', name: 'Summit Peak', x: 88, y: 26, color: '#a855f7', desc: 'Grand mathematical proofs and challenges.' },
        ],
        missions: [
          { slug: 'math-1', zone: 'puzzle-village', title: 'Ratio Bakery', type: 'Puzzle', diff: 'Beginner', xp: 50, x: 14, y: 82, prereq: null, obj: ['Solve proportional reasoning problems'] },
          { slug: 'math-2', zone: 'puzzle-village', title: 'Percentage Market', type: 'Quiz', diff: 'Beginner', xp: 75, x: 20, y: 48, prereq: 'math-1', obj: ['Calculate discounts, tax, and percent change'] },
          { slug: 'math-3', zone: 'algebra-city', title: 'Linear Balance', type: 'Interactive lesson', diff: 'Intermediate', xp: 100, x: 30, y: 32, prereq: 'math-2', obj: ['Solve two-step linear equations'] },
          { slug: 'math-4', zone: 'algebra-city', title: 'Quadratic Arcs', type: 'Puzzle', diff: 'Intermediate', xp: 125, x: 50, y: 56, prereq: 'math-3', obj: ['Factor quadratics and find parabola vertices'] },
          { slug: 'math-5', zone: 'number-mountains', title: 'Prime Summit', type: 'Challenge', diff: 'Intermediate', xp: 150, x: 66, y: 41, prereq: 'math-4', obj: ['Factor numbers into primes and exponents'] },
          { slug: 'math-6', zone: 'geometry-valley', title: 'Bridge Trigonometry', type: 'Quiz', diff: 'Advanced', xp: 175, x: 76, y: 84, prereq: 'math-5', obj: ['Apply Pythagorean theorem to right triangles'] },
          { slug: 'math-7', zone: 'theorem-keep', title: 'Coordinate Fortress', type: 'Interactive lesson', diff: 'Advanced', xp: 210, x: 82, y: 56, prereq: 'math-6', obj: ['Compute slope, midpoint, and distance on planes'] },
          { slug: 'math-8', zone: 'theorem-keep', title: 'Crown of Numbers', type: 'Challenge', diff: 'Master', xp: 250, x: 89, y: 24, prereq: 'math-7', obj: ['Combine algebra and geometry in a timed trial'] },
        ],
      },
      {
        subject: {
          name: 'Coding',
          slug: 'coding',
          description: 'Write, execute, and debug real Python, JavaScript, and Java code across 8 progressive coding worlds in Code Citadel.',
          icon: 'code-2',
          displayOrder: 5,
        },
        map: {
          mapName: 'Innovation Kingdom',
          mapSlug: 'innovation-kingdom',
          theme: {
            primaryColor: '#06b6d4',
            secondaryColor: '#f59e0b',
            oceanColor: '#0f1f38',
            badgeStyle: 'coding-cyan',
            ambientEffect: 'sparkles',
          },
          backgroundAsset: '/assets/maps/innovation-kingdom.jpg',
          previewAsset: '/assets/maps/innovation-kingdom.jpg',
        },
        zones: [
          { slug: 'syntax-meadows', name: 'Harbour Road', x: 22, y: 64, color: '#06b6d4', desc: 'Hello World, variables, and data types.' },
          { slug: 'logic-forest', name: 'Aqueduct Gate', x: 36, y: 36, color: '#22c55e', desc: 'Conditions, operators, and loops.' },
          { slug: 'function-castle', name: 'Moated Citadel', x: 58, y: 22, color: '#38bdf8', desc: 'Reusable functions, scope, and parameters.' },
          { slug: 'array-kingdom', name: 'Workshop Bridge', x: 56, y: 80, color: '#f59e0b', desc: 'Arrays, strings, searching, and sorting.' },
          { slug: 'master-arena', name: 'Clockwork Ridge', x: 80, y: 60, color: '#a855f7', desc: 'Algorithms, recursion, and DSA trials.' },
        ],
        missions: [
          { slug: 'code-1', zone: 'syntax-meadows', title: 'First Steps', type: 'Interactive lesson', diff: 'Beginner', xp: 100, x: 25, y: 76, prereq: null, obj: ['Master print statements, comments, and basic input/output'] },
          { slug: 'code-2', zone: 'syntax-meadows', title: 'Variable Village', type: 'Challenge', diff: 'Beginner', xp: 100, x: 18, y: 48, prereq: 'code-1', obj: ['Work with variables, integers, floats, strings, and type conversion'] },
          { slug: 'code-3', zone: 'logic-forest', title: 'Logic Forest', type: 'Challenge', diff: 'Intermediate', xp: 100, x: 32, y: 28, prereq: 'code-2', obj: ['Apply arithmetic, comparison, and logical operators with if/else'] },
          { slug: 'code-4', zone: 'logic-forest', title: 'Loop Valley', type: 'Challenge', diff: 'Intermediate', xp: 100, x: 43, y: 45, prereq: 'code-3', obj: ['Use for loops, while loops, break, continue, and nested loops'] },
          { slug: 'code-5', zone: 'function-castle', title: 'Function Castle', type: 'Challenge', diff: 'Intermediate', xp: 100, x: 60, y: 22, prereq: 'code-4', obj: ['Design reusable functions with parameters, return values, and scope'] },
          { slug: 'code-6', zone: 'array-kingdom', title: 'Array Kingdom', type: 'Challenge', diff: 'Advanced', xp: 100, x: 52, y: 82, prereq: 'code-5', obj: ['Traverse and manipulate arrays and strings'] },
          { slug: 'code-7', zone: 'master-arena', title: 'Algorithm Mountain', type: 'Challenge', diff: 'Advanced', xp: 100, x: 77, y: 81, prereq: 'code-6', obj: ['Implement linear search, binary search, sorting, and recursion'] },
          { slug: 'code-8', zone: 'master-arena', title: 'Master Arena', type: 'Project', diff: 'Master', xp: 100, x: 82, y: 52, prereq: 'code-7', obj: ['Solve mixed DSA and algorithmic problem-solving trials'] },
        ],
      },
    ] as const;

    for (const world of worlds) {
      let subjectDoc = await SubjectModel.findOne({ slug: world.subject.slug });
      if (!subjectDoc) {
        subjectDoc = await SubjectModel.create({
          ...world.subject,
          isActive: true,
        });
      }

      let mapDoc = await SubjectMapModel.findOne({ subjectId: subjectDoc._id, isPublished: true });
      if (!mapDoc) {
        mapDoc = await SubjectMapModel.create({
          subjectId: subjectDoc._id,
          mapName: world.map.mapName,
          mapSlug: world.map.mapSlug,
          theme: world.map.theme,
          backgroundAsset: world.map.backgroundAsset,
          previewAsset: world.map.previewAsset,
          mapConfiguration: {
            width: 1600,
            height: 960,
            minScale: 0.7,
            maxScale: 2.5,
            defaultCenterX: 50,
            defaultCenterY: 50,
          },
          isPublished: true,
          version: 1,
        });
      } else {
        mapDoc.mapName = world.map.mapName;
        mapDoc.mapSlug = world.map.mapSlug;
        mapDoc.theme = world.map.theme;
        mapDoc.backgroundAsset = world.map.backgroundAsset;
        mapDoc.previewAsset = world.map.previewAsset;
        await mapDoc.save();
      }

      const zoneIdBySlug = new Map<string, typeof mapDoc._id>();
      for (let i = 0; i < world.zones.length; i += 1) {
        const z = world.zones[i];
        const zoneDoc = await MapLocationModel.findOneAndUpdate(
          { mapId: mapDoc._id, slug: z.slug },
          {
            $set: {
              name: z.name,
              positionX: z.x,
              positionY: z.y,
              accentColor: z.color,
              description: z.desc,
            },
            $setOnInsert: {
              mapId: mapDoc._id,
              slug: z.slug,
              locationType: 'zone',
              displayOrder: i + 1,
              isActive: true,
            },
          },
          { upsert: true, new: true },
        );
        zoneIdBySlug.set(z.slug, zoneDoc._id);
      }

      const missionIdBySlug = new Map<string, typeof mapDoc._id>();
      for (let i = 0; i < world.missions.length; i += 1) {
        const m = world.missions[i];
        const prereqId = m.prereq ? missionIdBySlug.get(m.prereq) : undefined;
        const missionDoc = await MissionModel.findOneAndUpdate(
          { mapId: mapDoc._id, slug: m.slug },
          {
            $set: {
              locationId: zoneIdBySlug.get(m.zone),
              title: m.title,
              missionType: m.type,
              difficulty: m.diff,
              xpReward: m.xp,
              prerequisites: prereqId ? [prereqId] : [],
              sequence: i + 1,
              positionX: m.x,
              positionY: m.y,
              isPublished: true,
            },
            $setOnInsert: {
              subjectId: subjectDoc._id,
              mapId: mapDoc._id,
              slug: m.slug,
              description: `Embark on ${m.title} in ${world.map.mapName}.`,
              gradeEligibility: ['6', '7', '8', '9', '10'],
              estimatedDurationMinutes: 10,
              learningObjectives: [...m.obj],
            },
          },
          { upsert: true, new: true },
        );
        missionIdBySlug.set(m.slug, missionDoc._id);
      }
    }
  })().catch((err) => {
    seedPromise = null;
    throw err;
  });

  return seedPromise;
}
