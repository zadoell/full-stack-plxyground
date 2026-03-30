// Seed script – idempotent (checks before inserting) – Supabase version
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Require seed passwords to be supplied via environment variables
if (!process.env.SEED_ADMIN_PASSWORD) {
  console.error('ABORT: SEED_ADMIN_PASSWORD environment variable is required.');
  console.error('  Set it in your .env file before running the seed script.');
  process.exit(1);
}
if (!process.env.SEED_USER_PASSWORD) {
  console.error('ABORT: SEED_USER_PASSWORD environment variable is required.');
  console.error('  Set it in your .env file before running the seed script.');
  process.exit(1);
}

// Safety: prevent accidental seeding in production
if (process.env.NODE_ENV === 'production' && !process.env.SEED_FORCE) {
  console.error('ABORT: Cannot seed in production. Set SEED_FORCE=1 to override.');
  process.exit(1);
}

const supabase = require('../src/db');

const SALT_ROUNDS = 10;

// ── Curated Unsplash sports media URLs (CORS-safe, no runtime fetch) ──
const MEDIA_URLS = [
  'https://images.unsplash.com/photo-1461896836934-bd45ba8fcb36?w=800',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
  'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=800',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
  'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800',
  'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800',
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800',
  'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=800',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800',
  'https://images.unsplash.com/photo-1461896836934-bd45ba8fcb36?w=800',
];

const CONTENT_TYPES = ['article', 'video_embed', 'image_story'];

const CREATOR_NAMES = [
  'Sarah Johnson', 'Marcus Rivera', 'Aisha Patel', 'Jordan Kim',
  'Olivia Chen', 'David Thompson', 'Luna Martinez', 'Alex Nguyen',
  'Maya Williams', 'Chris Carter'
];

const BUSINESS_NAMES = [
  { name: 'Nike Sports', email: 'nike@plxyground.local' },
  { name: 'Adidas Athletics', email: 'adidas@plxyground.local' },
  { name: 'Under Armour Pro', email: 'underarmour@plxyground.local' },
];

const ATHLETE_NAMES = [
  { name: 'LeBron James Jr', email: 'lebron@plxyground.local' },
  { name: 'Simone Grant', email: 'simone@plxyground.local' },
  { name: 'Usain Williams', email: 'usain@plxyground.local' },
];

const CONTENT_BODIES = [
  `The morning session started at 5 AM with a grueling track workout. Coach had us doing 400m repeats — ten of them — with only 90 seconds rest between each. By the sixth rep, my legs were screaming, but I kept pushing through. This is what separates champions from everyone else. The mental game is just as important as the physical one.\n\nAfter the track work, we moved into the weight room for a full-body strength circuit. Deadlifts, box jumps, medicine ball throws. Every muscle fiber engaged. Recovery starts with a proper cool-down and nutrition within 30 minutes of finishing.`,

  `Breaking down the film from last night's game reveals some fascinating tactical decisions. The defensive line shifted to a 3-4 formation in the second half, which completely changed the dynamics of the pass rush. The quarterback's pocket presence improved dramatically once he started reading the safety's movements pre-snap.\n\nKey takeaway: adaptability wins games. Teams that can adjust their strategy mid-game based on what the opponent is showing them will always have an edge over those running the same playbook regardless of circumstances.`,

  `Just wrapped up an incredible photoshoot at the new downtown arena. The lighting in there is absolutely perfect for sports photography — the way it catches the sweat and movement of the athletes creates these stunning frozen moments.\n\nSharing some behind-the-scenes of the setup: two strobes on either side of the court, a remote trigger mounted on the backboard, and a 70-200mm f/2.8 lens. The combination gives you that beautiful bokeh while keeping the subject tack-sharp.`,

  `Training camp update: Day 15 and the intensity hasn't let up. Today we focused on agility drills — ladder work, cone drills, and reaction training. The new GPS tracking system we're using shows measurable improvement in change-of-direction speed across the entire squad.\n\nNutrition spotlight: we've shifted to a higher protein intake during this phase — roughly 2.2g per kg of bodyweight — with strategic carb timing around workouts. The sports dietitian has also introduced tart cherry juice for recovery. Early results are promising.`,

  `Stadium atmosphere breakdown: What makes a great sporting venue isn't just the architecture — it's the acoustic design, sight lines, and crowd flow that create an unforgettable experience. I visited 12 stadiums across three countries this year and here's what I found.\n\nThe best venues share common traits: steep seating bowls that keep fans close to the action, natural turf that performs well in all weather, state-of-the-art LED boards that enhance without distracting, and concourse designs that keep people moving during peak times.`,

  `Recovery day journal: After pushing hard all week, today is dedicated to active recovery. Started with 30 minutes of light swimming — easy laps focusing on breathing and rotation. Followed by a yoga session emphasizing hip flexibility and thoracic spine mobility.\n\nAfternoon protocol includes contrast therapy (alternating hot and cold), foam rolling, and a session with the physio working on that persistent tightness in my left hamstring. Proper recovery isn't lazy — it's strategic.`,

  `The science of sports visualization is finally getting the respect it deserves. New research from the Sports Psychology Institute shows that athletes who practice mental rehearsal alongside physical training see a 23% improvement in competition performance compared to physical training alone.\n\nI've been incorporating 15 minutes of visualization before every training session this season. I close my eyes, run through each drill mentally, feel the movements, hear the crowd. When I step onto the field, it feels like I've already been there.`,

  `Game day nutrition playbook: Here's exactly what I eat on competition days, timed to the minute. 4 hours before: complex carbs (oatmeal with banana and honey), moderate protein (eggs), plenty of water. 2 hours before: lighter meal — rice cakes with almond butter. 30 minutes before: small banana and electrolyte drink.\n\nDuring: sips of sports drink every 15 minutes. Halftime: energy gel if needed. Post-game: protein shake within 20 minutes, then a full meal within 2 hours. This protocol has eliminated any energy crashes.`,

  `Community spotlight: Our youth development program just graduated its 100th participant! These kids came in with varying levels of athletic ability, but every single one left with improved fitness, confidence, and teamwork skills.\n\nThe program runs 12 weeks and covers fundamentals across multiple sports — basketball, soccer, track, and swimming. We don't specialize early. Instead, we build well-rounded athletic foundations. Parents report improvements not just in sports, but in school focus and social skills too.`,

  `Equipment review: I've been testing the new carbon-plate training shoes for the past 6 weeks across different surfaces and intensities. Here's my honest take.\n\nPros: Incredible energy return on hard surfaces, noticeable improvement in sprint times (about 0.15s on my 100m), comfortable for sessions up to 90 minutes. Cons: Durability concerns — the foam is showing wear faster than traditional trainers, and the grip on wet surfaces isn't ideal. Final verdict: great for competition and speed sessions, but keep your traditional trainers for daily training.`,
];

async function seed() {
  console.log('🌱 Seeding PLXYGROUND database (Supabase)...');

  // ── Admin ──
  const { data: adminExists } = await supabase
    .from('admins')
    .select('id')
    .eq('email', 'admin@plxyground.local')
    .maybeSingle();

  if (!adminExists) {
    const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, SALT_ROUNDS);
    const { error } = await supabase.from('admins').insert({
      email: 'admin@plxyground.local',
      password_hash: hash,
      role: 'ADMIN',
      is_active: true,
    });
    if (error) throw error;
    console.log('  ✓ Admin seeded');
  } else {
    console.log('  ⏭ Admin already exists');
  }

  // ── Creators (10) ──
  const creatorIds = [];
  for (let i = 0; i < CREATOR_NAMES.length; i++) {
    const name = CREATOR_NAMES[i];
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const email = i === 0 ? 'sarahjohnson@plxyground.local' : `${slug}@plxyground.local`;

    const { data: existing } = await supabase
      .from('creators')
      .select('id')
      .eq('profile_slug', slug)
      .maybeSingle();

    if (existing) {
      creatorIds.push(existing.id);
      continue;
    }

    const { data: creator, error: crErr } = await supabase
      .from('creators')
      .insert({
        name,
        role: 'creator',
        bio: 'Professional athlete and content creator. Passionate about sports, fitness, and inspiring the next generation. Based in various cities, sharing the journey one post at a time.',
        location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'London', 'Toronto', 'Sydney', 'Tokyo', 'Berlin', 'Paris'][i],
        profile_slug: slug,
        social_links: { twitter: `@${slug}`, instagram: `@${slug}_sports` },
        is_active: true,
      })
      .select('id')
      .single();
    if (crErr) throw crErr;
    creatorIds.push(creator.id);

    const passHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD, SALT_ROUNDS);
    const { error: acErr } = await supabase.from('creator_accounts').insert({
      creator_id: creator.id,
      email,
      password_hash: passHash,
      is_approved: true,
    });
    if (acErr) throw acErr;
  }
  console.log(`  ✓ ${CREATOR_NAMES.length} Creators seeded`);

  // ── Business accounts (3) ──
  for (let i = 0; i < BUSINESS_NAMES.length; i++) {
    const biz = BUSINESS_NAMES[i];
    const slug = biz.name.toLowerCase().replace(/\s+/g, '-');

    const { data: existing } = await supabase
      .from('creators')
      .select('id')
      .eq('profile_slug', slug)
      .maybeSingle();

    if (existing) {
      creatorIds.push(existing.id);
      continue;
    }

    const { data: creator, error: crErr } = await supabase
      .from('creators')
      .insert({
        name: biz.name,
        role: 'business',
        bio: 'Leading sports brand committed to performance and innovation.',
        location: 'Global',
        profile_slug: slug,
        social_links: { website: `https://${slug}.com` },
        is_active: true,
      })
      .select('id')
      .single();
    if (crErr) throw crErr;
    creatorIds.push(creator.id);

    const passHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD, SALT_ROUNDS);
    const { error: acErr } = await supabase.from('creator_accounts').insert({
      creator_id: creator.id,
      email: biz.email,
      password_hash: passHash,
      is_approved: true,
    });
    if (acErr) throw acErr;
  }
  console.log(`  ✓ ${BUSINESS_NAMES.length} Businesses seeded`);

  // ── Athletes (3) ──
  for (let i = 0; i < ATHLETE_NAMES.length; i++) {
    const ath = ATHLETE_NAMES[i];
    const slug = ath.name.toLowerCase().replace(/\s+/g, '-');

    const { data: existing } = await supabase
      .from('creators')
      .select('id')
      .eq('profile_slug', slug)
      .maybeSingle();

    if (existing) {
      creatorIds.push(existing.id);
      continue;
    }

    const { data: creator, error: crErr } = await supabase
      .from('creators')
      .insert({
        name: ath.name,
        role: 'athlete',
        bio: 'Professional athlete competing at the highest level. Training, competing, and sharing the journey.',
        location: ['Miami', 'Houston', 'Kingston'][i],
        profile_slug: slug,
        social_links: { twitter: `@${slug.replace(/-/g, '')}`, instagram: `@${slug.replace(/-/g, '')}_athlete` },
        is_active: true,
      })
      .select('id')
      .single();
    if (crErr) throw crErr;
    creatorIds.push(creator.id);

    const passHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD, SALT_ROUNDS);
    const { error: acErr } = await supabase.from('creator_accounts').insert({
      creator_id: creator.id,
      email: ath.email,
      password_hash: passHash,
      is_approved: true,
    });
    if (acErr) throw acErr;
  }
  console.log(`  ✓ ${ATHLETE_NAMES.length} Athletes seeded`);

  // ── Content (10 posts per creator = 100+) ──
  const { count: existingCount } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true });

  if (existingCount === 0) {
    const titles = [
      'Morning Training Breakdown', 'Game Film Analysis', 'Arena Photoshoot BTS',
      'Training Camp Day 15', 'Stadium Experience Guide', 'Recovery Day Protocol',
      'Mental Visualization Science', 'Game Day Nutrition', 'Youth Program Spotlight',
      'Gear Review: Carbon Plates'
    ];

    const now = Date.now();
    let postIndex = 0;
    for (let ci = 0; ci < creatorIds.length; ci++) {
      for (let pi = 0; pi < 10; pi++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(now - daysAgo * 86400000).toISOString();
        const isPublished = postIndex % 5 !== 0;
        const contentType = CONTENT_TYPES[postIndex % 3];
        const mediaUrl = MEDIA_URLS[postIndex % MEDIA_URLS.length];
        const body = CONTENT_BODIES[pi % CONTENT_BODIES.length];
        const title = `${titles[pi % titles.length]} #${postIndex + 1}`;

        const { data: contentRow, error: cErr } = await supabase
          .from('content')
          .insert({
            creator_id: creatorIds[ci],
            content_type: contentType,
            title,
            body,
            media_url: mediaUrl,
            order_priority: postIndex,
            is_published: isPublished,
            published_at: isPublished ? createdAt : null,
            feed_rank_at: isPublished ? createdAt : null,
            created_at: createdAt,
            updated_at: createdAt,
          })
          .select('id')
          .single();
        if (cErr) throw cErr;

        // Add pending content to moderation queue
        if (!isPublished) {
          const { data: creatorRow } = await supabase
            .from('creators')
            .select('name')
            .eq('id', creatorIds[ci])
            .maybeSingle();
          const creatorName = creatorRow?.name || 'Unknown';

          await supabase.from('moderation_queue').insert({
            type: 'content',
            status: 'pending',
            title_or_name: title,
            submitted_by: creatorName,
            report_count: 0,
            entity_id: contentRow.id,
            created_at: createdAt,
          });
        }

        postIndex++;
      }
    }
    console.log(`  ✓ ${postIndex} Content posts seeded (${Math.floor(postIndex * 0.2)} pending)`);
  } else {
    console.log(`  ⏭ Content already exists (${existingCount} rows)`);
  }

  // ── Opportunities (8) ──
  const { count: oppCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true });

  if (oppCount === 0) {
    const opps = [
      { title: 'Brand Ambassador – Nike Running', role_type: 'ambassador', body: 'Join our team of elite runners representing Nike at national events.', requirements: 'Active social media, 10k+ followers, competitive running background', benefits: 'Product sponsorship, event access, monthly stipend' },
      { title: 'Content Creator – Adidas Training', role_type: 'creator', body: 'Create workout content featuring Adidas training gear.', requirements: 'Video production skills, fitness certification preferred', benefits: 'Gear allowance, production budget, revenue share' },
      { title: 'Youth Coach – Community Program', role_type: 'coach', body: 'Lead youth sports development sessions in underserved communities.', requirements: 'Coaching certification, background check, 2+ years experience', benefits: 'Competitive hourly rate, equipment provided, continuing education' },
      { title: 'Sports Reporter – Stadium Series', role_type: 'reporter', body: 'Cover live events for our digital sports platform.', requirements: 'Journalism background, on-camera experience', benefits: 'Press credentials, travel covered, per-article compensation' },
      { title: 'Fitness Model – Campaign 2026', role_type: 'model', body: 'Feature in our upcoming spring/summer campaign shoot.', requirements: 'Athletic build, previous modeling experience preferred', benefits: 'Day rate, usage rights compensation, travel & accommodation' },
      { title: 'Podcast Host – The Sports Desk', role_type: 'host', body: 'Host a weekly sports analysis podcast.', requirements: 'Strong sports knowledge, clear speaking voice, reliable schedule', benefits: 'Episode fee, sponsorship revenue share, studio access' },
      { title: 'Nutritionist – Team Partnership', role_type: 'specialist', body: 'Develop meal plans for our athlete roster.', requirements: 'Registered dietitian, sports nutrition specialization', benefits: 'Contract rate, published credit, speaking opportunities' },
      { title: 'Photographer – Event Coverage', role_type: 'photographer', body: 'Capture high-energy sports moments at live events.', requirements: 'Professional camera equipment, sports portfolio', benefits: 'Event fee, image licensing, credential access' },
    ];
    for (const opp of opps) {
      const bizCreatorId = creatorIds[creatorIds.length - Math.floor(Math.random() * 3) - 1];
      const { error } = await supabase.from('opportunities').insert({
        creator_id: bizCreatorId,
        title: opp.title,
        role_type: opp.role_type,
        body: opp.body,
        requirements: opp.requirements,
        benefits: opp.benefits,
        is_published: true,
      });
      if (error) throw error;
    }
    console.log(`  ✓ ${opps.length} Opportunities seeded`);
  }

  // ── Audit log entries ──
  const { count: auditCount } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: true });

  if (auditCount === 0) {
    const entries = [
      { action_type: 'admin.login', actor: 'admin@plxyground.local', target: 'system', reason: 'Initial login' },
      { action_type: 'content.approve', actor: 'admin@plxyground.local', target: 'content:2', reason: 'Quality content' },
      { action_type: 'user.create', actor: 'system', target: 'sarah-johnson', reason: 'Self-registration' },
    ];
    const { error } = await supabase.from('audit_log').insert(entries);
    if (error) throw error;
    console.log('  ✓ Audit log entries seeded');
  }

  console.log('🎉 Seeding complete!');
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
