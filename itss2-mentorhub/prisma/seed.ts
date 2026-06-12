/* eslint-disable no-console */
/**
 * Seed dữ liệu demo cho Stubiz MentorHub.
 * Trọng tâm: nhiều kênh thảo luận (đặc biệt là kênh "Quy trình doanh nghiệp"),
 * nhiều cố vấn với hồ sơ phong phú, mỗi kênh có vài chủ đề và câu trả lời chi tiết.
 */
import { PrismaClient, type ChannelCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function upsertUser(email: string, name: string, role: 'STUDENT' | 'MENTOR' | 'ADMIN' | 'EMPLOYER', password: string) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role },
    create: { email, name, role, password, verified: true },
  });
}

interface MentorSeed {
  email: string;
  name: string;
  company: string;
  position: string;
  yearsOfExperience: number;
  expertise: string[];
  bio: string;
}

interface ThreadSeed {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorEmail: string; // student or mentor email
  answers: Array<{
    id: string;
    authorEmail: string;
    isAnonymous?: boolean;
    accepted?: boolean;
    content: string;
  }>;
}

interface ChannelSeed {
  name: string;
  slug: string;
  category: ChannelCategory;
  tags: string[];
  description: string;
  threads: ThreadSeed[];
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱 Seeding demo data...');

  const pwd = await bcrypt.hash('password123', 10);

  // ---- Sinh viên + Admin -------------------------------------------------
  const admin = await upsertUser('admin@itss.local', 'Quản trị viên', 'ADMIN', pwd);
  const alice = await upsertUser('alice@student.local', 'Nguyễn Minh Anh', 'STUDENT', pwd);
  const bob = await upsertUser('bob@student.local', 'Trần Quốc Bảo', 'STUDENT', pwd);
  const chi = await upsertUser('chi@student.local', 'Phạm Linh Chi', 'STUDENT', pwd);
  const duc = await upsertUser('duc@student.local', 'Lê Anh Đức', 'STUDENT', pwd);
  const ha = await upsertUser('ha@student.local', 'Vũ Thu Hà', 'STUDENT', pwd);
  const long = await upsertUser('long@student.local', 'Đinh Hoàng Long', 'STUDENT', pwd);
  const my = await upsertUser('my@student.local', 'Ngô Diễm My', 'STUDENT', pwd);
  const phuc = await upsertUser('phuc@student.local', 'Trịnh Hữu Phúc', 'STUDENT', pwd);
  const quynh = await upsertUser('quynh@student.local', 'Lý Như Quỳnh', 'STUDENT', pwd);
  const viet = await upsertUser('viet@student.local', 'Hoàng Văn Việt', 'STUDENT', pwd);
  const nhi = await upsertUser('nhi@student.local', 'Phạm Yến Nhi', 'STUDENT', pwd);
  const tam = await upsertUser('tam@student.local', 'Nguyễn Minh Tâm', 'STUDENT', pwd);

  await prisma.studentProfile.upsert({
    where: { userId: alice.id },
    update: {},
    create: {
      userId: alice.id,
      university: 'Đại học Bách khoa Hà Nội',
      major: 'Kỹ thuật phần mềm',
      yearOfStudy: 4,
      skills: ['react', 'typescript', 'nodejs'],
      bio: 'Đang chuẩn bị thực tập fullstack mùa hè.',
    },
  });
  await prisma.studentProfile.upsert({
    where: { userId: bob.id },
    update: {},
    create: {
      userId: bob.id,
      university: 'PTIT',
      major: 'Khoa học máy tính',
      yearOfStudy: 3,
      skills: ['python', 'sql'],
    },
  });

  // ---- Doanh nghiệp (employer) --------------------------------------------
  const employer = await upsertUser('hr@fpt.local', 'HR FPT', 'EMPLOYER', pwd);
  const fpt = await prisma.company.upsert({
    where: { slug: 'fpt-software' },
    update: {},
    create: {
      name: 'FPT Software',
      slug: 'fpt-software',
      description: 'Công ty phần mềm hàng đầu Việt Nam.',
      industry: 'IT Services',
      location: 'Hà Nội',
      size: 'LARGE',
      verified: true,
    },
  });
  await prisma.employerProfile.upsert({
    where: { userId: employer.id },
    update: { companyId: fpt.id, title: 'Tech Recruiter' },
    create: { userId: employer.id, companyId: fpt.id, title: 'Tech Recruiter' },
  });

  // Giữ tham chiếu admin để TS không cảnh báo unused
  void admin;
  void chi;
  void duc;
  void ha;
  void long;
  void my;
  void phuc;
  void quynh;
  void viet;
  void nhi;
  void tam;

  // ---- Cố vấn (mentors) — phong phú, nhiều ngành ------------------------
  const mentorSeeds: MentorSeed[] = [
    {
      email: 'mentor.linh@itss.local',
      name: 'Phạm Mỹ Linh',
      company: 'Money Forward (Tokyo)',
      position: 'Senior Backend Engineer',
      yearsOfExperience: 7,
      expertise: ['golang', 'kubernetes', 'system-design', 'postgres'],
      bio: 'Xây dựng nền tảng fintech cho thị trường Nhật. Đam mê tối ưu hệ thống phân tán, sẵn lòng review CV và roadmap cho các bạn muốn theo hướng backend / SRE.',
    },
    {
      email: 'mentor.tuan@itss.local',
      name: 'Nguyễn Đức Tuấn',
      company: 'FPT Software',
      position: 'Tech Lead - Frontend',
      yearsOfExperience: 9,
      expertise: ['react', 'nextjs', 'typescript', 'micro-frontend'],
      bio: 'Hơn 9 năm với Frontend, từng dẫn dắt 3 team xuyên quốc gia. Sẵn sàng chia sẻ về Code Review, Coding Convention và cách scale một codebase React lớn.',
    },
    {
      email: 'mentor.huong@itss.local',
      name: 'Đặng Thu Hương',
      company: 'Grab Vietnam',
      position: 'Engineering Manager',
      yearsOfExperience: 11,
      expertise: ['scrum', 'okr', 'leadership', 'agile'],
      bio: 'Quản lý 5 team cross-functional. Sở trường: chuyển đổi Agile, xây dựng văn hóa "blameless postmortem", coaching kỹ sư trẻ vào ngạch tech lead.',
    },
    {
      email: 'mentor.minh@itss.local',
      name: 'Hoàng Quang Minh',
      company: 'VNG Cloud',
      position: 'Senior DevOps Engineer',
      yearsOfExperience: 8,
      expertise: ['aws', 'docker', 'kubernetes', 'terraform', 'ci-cd'],
      bio: 'Vận hành hạ tầng cho >2 triệu user. Có kinh nghiệm migrate hệ thống legacy sang AWS/EKS, hướng dẫn các bạn intern quen với CI/CD pipeline thực tế.',
    },
    {
      email: 'mentor.khoi@itss.local',
      name: 'Bùi Đăng Khôi',
      company: 'Shopee',
      position: 'Staff Engineer - Search Platform',
      yearsOfExperience: 10,
      expertise: ['java', 'kafka', 'elasticsearch', 'system-design'],
      bio: 'Phụ trách kiến trúc cho hệ thống tìm kiếm tỷ truy vấn/tháng. Thích viết về trade-off khi chọn message broker, schema design và caching layer.',
    },
    {
      email: 'mentor.thao@itss.local',
      name: 'Lê Phương Thảo',
      company: 'Sun Asterisk',
      position: 'Senior QA Lead',
      yearsOfExperience: 6,
      expertise: ['qa', 'test-automation', 'cypress', 'playwright'],
      bio: 'Đam mê chất lượng. Đã xây dựng QA pipeline cho 4 dự án outsource lớn. Tư vấn cho sinh viên muốn theo hướng QA/SDET — một ngạch ít cạnh tranh nhưng giá trị cao.',
    },
    {
      email: 'mentor.son@itss.local',
      name: 'Trần Hồng Sơn',
      company: 'VNPay',
      position: 'Senior Mobile Engineer',
      yearsOfExperience: 7,
      expertise: ['flutter', 'react-native', 'ios', 'android'],
      bio: 'Build app thanh toán cho hàng triệu user. Tư vấn lộ trình từ React Native chuyển sang native, cũng như quy trình release App Store / Play Store.',
    },
    {
      email: 'mentor.giang@itss.local',
      name: 'Phan Trường Giang',
      company: 'VinAI',
      position: 'AI Research Engineer',
      yearsOfExperience: 5,
      expertise: ['python', 'pytorch', 'llm', 'mlops'],
      bio: 'Nghiên cứu LLM và Computer Vision. Hỗ trợ sinh viên chuẩn bị portfolio AI thực tế, ra quyết định giữa hướng research và applied ML.',
    },
    {
      email: 'mentor.nga@itss.local',
      name: 'Đỗ Thanh Nga',
      company: 'Techcombank',
      position: 'Senior Data Engineer',
      yearsOfExperience: 6,
      expertise: ['spark', 'airflow', 'snowflake', 'sql'],
      bio: 'Xây dựng data platform cho ngân hàng. Sẵn lòng chia sẻ kinh nghiệm chuyển từ developer sang data, dim/fact modeling và cách viết Airflow DAG sạch.',
    },
    {
      email: 'mentor.hieu@itss.local',
      name: 'Vũ Minh Hiếu',
      company: 'Axon (US, remote)',
      position: 'Principal Software Engineer',
      yearsOfExperience: 13,
      expertise: ['system-design', 'aws', 'mentoring', 'career'],
      bio: 'Hơn 13 năm trong ngành, làm việc remote với team US. Chuyên sâu về kiến trúc, định hướng nghề nghiệp cho kỹ sư muốn ra thị trường nước ngoài.',
    },
    {
      email: 'mentor.an@itss.local',
      name: 'Cao Tuấn An',
      company: 'VinCSS',
      position: 'Senior Security Engineer',
      yearsOfExperience: 8,
      expertise: ['security', 'pentest', 'owasp', 'cryptography'],
      bio: 'Pentester có chứng chỉ OSCP, đã tìm và báo cáo hơn 40 lỗ hổng cho các sản phẩm fintech. Đam mê hướng dẫn sinh viên theo nghề bảo mật ứng dụng.',
    },
    {
      email: 'mentor.trang@itss.local',
      name: 'Lương Thuỳ Trang',
      company: 'Tiki',
      position: 'Senior Product Designer',
      yearsOfExperience: 7,
      expertise: ['ui', 'ux', 'figma', 'design-system'],
      bio: 'Thiết kế trải nghiệm cho 20+ triệu user thương mại điện tử. Chia sẻ về quy trình design thinking, design system và cách dev–design phối hợp hiệu quả.',
    },
    {
      email: 'mentor.duy@itss.local',
      name: 'Mai Khánh Duy',
      company: 'Got It AI',
      position: 'Engineering Manager - Platform',
      yearsOfExperience: 12,
      expertise: ['leadership', 'hiring', 'product', 'startup'],
      bio: 'Founding engineer của 2 startup, hiện quản lý platform team 18 người. Cố vấn cho sinh viên về startup, hiring, và bước chuyển từ IC sang manager.',
    },
    {
      email: 'mentor.bich@itss.local',
      name: 'Hồ Ngọc Bích',
      company: 'Microsoft (Singapore)',
      position: 'Senior SDET',
      yearsOfExperience: 9,
      expertise: ['test-strategy', 'automation', 'k6', 'performance'],
      bio: 'Xây dựng test platform cho hàng trăm microservice. Sẵn lòng chia sẻ test strategy nhiều tầng, performance testing với k6, và roadmap SDET.',
    },
    {
      email: 'mentor.quan@itss.local',
      name: 'Đoàn Bảo Quân',
      company: 'Sky Mavis (Axie Infinity)',
      position: 'Senior Game / Blockchain Engineer',
      yearsOfExperience: 8,
      expertise: ['unity', 'solidity', 'web3', 'game-dev'],
      bio: 'Phát triển game blockchain với hàng triệu user. Tư vấn các bạn quan tâm game dev hoặc Web3 — hai lĩnh vực ngách nhưng đang rất khát người.',
    },
    {
      email: 'mentor.hoang@itss.local',
      name: 'Trần Văn Hoàng',
      company: 'Viettel Digital',
      position: 'Principal Database Administrator',
      yearsOfExperience: 12,
      expertise: ['postgres', 'oracle', 'query-tuning', 'replication', 'sql'],
      bio: 'Vận hành cụm database hàng chục TB cho hệ thống viễn thông. Chuyên sâu index strategy, query plan, high-availability. Sẵn lòng review schema và "khám bệnh" câu query chậm cho các bạn.',
    },
    {
      email: 'mentor.dang@itss.local',
      name: 'Nguyễn Hải Đăng',
      company: 'AWS (Singapore)',
      position: 'Senior Solutions Architect',
      yearsOfExperience: 11,
      expertise: ['aws', 'cloud-architecture', 'serverless', 'cost-optimization', 'well-architected'],
      bio: 'Tư vấn kiến trúc cloud cho doanh nghiệp lớn khu vực APAC. Đam mê chia sẻ về Well-Architected Framework, tối ưu chi phí cloud và lộ trình lấy chứng chỉ AWS.',
    },
    {
      email: 'mentor.cuong@itss.local',
      name: 'Lê Quốc Cường',
      company: 'Bosch Global Software',
      position: 'Senior Embedded Engineer',
      yearsOfExperience: 9,
      expertise: ['c', 'cpp', 'embedded', 'iot', 'rtos', 'firmware'],
      bio: 'Lập trình firmware cho hệ thống ô tô và IoT. Tư vấn cho các bạn yêu thích phần cứng – phần mềm nhúng, một ngạch ít người theo nhưng lương cao và bền vững.',
    },
    {
      email: 'mentor.phuong@itss.local',
      name: 'Đặng Mai Phương',
      company: 'MoMo',
      position: 'Senior Product Manager',
      yearsOfExperience: 8,
      expertise: ['product', 'roadmap', 'user-research', 'data-driven', 'a-b-testing'],
      bio: 'Quản lý sản phẩm cho ví điện tử chục triệu user. Chia sẻ về cách viết PRD, ưu tiên backlog, làm việc với engineer, và lộ trình chuyển từ dev sang Product Manager.',
    },
    {
      email: 'mentor.nghia@itss.local',
      name: 'Vũ Đình Nghĩa',
      company: 'FPT IS',
      position: 'Senior ERP / SAP Consultant',
      yearsOfExperience: 10,
      expertise: ['sap', 'erp', 'abap', 'business-process', 'integration'],
      bio: 'Triển khai ERP cho các tập đoàn sản xuất. Hướng dẫn các bạn quan tâm mảng ERP/SAP — lĩnh vực kết hợp nghiệp vụ doanh nghiệp và công nghệ, nhu cầu tuyển dụng luôn cao.',
    },
    {
      email: 'mentor.tung@itss.local',
      name: 'Bùi Thanh Tùng',
      company: 'Freelancer (Upwork Top Rated)',
      position: 'Full-stack Freelance Engineer',
      yearsOfExperience: 7,
      expertise: ['freelance', 'nextjs', 'nodejs', 'client-management', 'personal-brand'],
      bio: 'Freelancer toàn thời gian 4 năm, top-rated trên Upwork. Tư vấn cách bắt đầu freelance, định giá, tìm khách nước ngoài và xây personal brand cho dev muốn làm tự do.',
    },
  ];

  const mentorUsers: Record<string, { id: string }> = {};
  for (const m of mentorSeeds) {
    const u = await prisma.user.upsert({
      where: { email: m.email },
      update: { name: m.name, role: 'MENTOR' },
      create: { email: m.email, name: m.name, password: pwd, role: 'MENTOR', verified: true },
    });
    mentorUsers[m.email] = { id: u.id };
    await prisma.mentorProfile.upsert({
      where: { userId: u.id },
      update: {
        company: m.company,
        position: m.position,
        yearsOfExperience: m.yearsOfExperience,
        expertise: m.expertise,
        bio: m.bio,
        verified: true,
        openToChat: true,
      },
      create: {
        userId: u.id,
        company: m.company,
        position: m.position,
        yearsOfExperience: m.yearsOfExperience,
        expertise: m.expertise,
        bio: m.bio,
        verified: true,
        openToChat: true,
      },
    });
  }

  const userIdByEmail: Record<string, string> = {
    'alice@student.local': alice.id,
    'bob@student.local': bob.id,
    'chi@student.local': chi.id,
    'duc@student.local': duc.id,
    'ha@student.local': ha.id,
    'long@student.local': long.id,
    'my@student.local': my.id,
    'phuc@student.local': phuc.id,
    'quynh@student.local': quynh.id,
    'viet@student.local': viet.id,
    'nhi@student.local': nhi.id,
    'tam@student.local': tam.id,
    ...Object.fromEntries(Object.entries(mentorUsers).map(([email, u]) => [email, u.id])),
  };

  // -----------------------------------------------------------------------
  // CHANNELS — chú trọng "Quy trình doanh nghiệp"
  // -----------------------------------------------------------------------
  const channels: ChannelSeed[] = [
    // ====================================================================
    // 1. QUY TRÌNH DOANH NGHIỆP - GIT WORKFLOW (kênh trọng tâm)
    // ====================================================================
    {
      name: 'Git Flow & Quy trình doanh nghiệp',
      slug: 'git-workflow-enterprise',
      category: 'PROCESS_GIT',
      tags: ['gitflow', 'git', 'pull-request', 'code-review', 'enterprise'],
      description:
        'Mọi thứ về luồng Git trong doanh nghiệp thực tế: branching model, commit convention, code review, conflict resolution, release process. Đừng để "cú sốc quy trình" cản bước bạn ngày đầu thực tập.',
      threads: [
        {
          id: 'th-git-1',
          title: 'Git Flow vs Trunk-based — công ty mình nên chọn cái nào?',
          authorEmail: 'alice@student.local',
          tags: ['gitflow', 'trunk-based', 'release'],
          content:
            '<p>Em đang thực tập ở một startup ~15 dev. Hiện tại các bạn vẫn merge thẳng vào <code>main</code> rồi deploy tay. Trưởng nhóm muốn em đề xuất một quy trình Git "có quy củ".</p><p>Em đọc thì thấy có 2 trường phái chính: <strong>Git Flow</strong> (feature/develop/release/hotfix) và <strong>Trunk-based development</strong>. Mọi người tư vấn giúp em với?</p>',
          answers: [
            {
              id: 'an-git-1-1',
              authorEmail: 'mentor.huong@itss.local',
              accepted: true,
              content:
                '<p>Câu hỏi rất hay. Trả lời ngắn gọn: <strong>với team 15 dev deploy thường xuyên → chọn Trunk-based</strong>.</p><ol><li><strong>Git Flow</strong> sinh ra ~2010 khi software ship theo phiên bản (v1.0, v1.1...). Có <code>develop</code>, <code>release/*</code>, <code>hotfix/*</code> — rất phù hợp khi bạn bán phần mềm đóng hộp, mobile app cần app-store review.</li><li><strong>Trunk-based</strong> phù hợp với SaaS / web deploy nhiều lần/ngày: 1 nhánh <code>main</code> luôn deployable, mỗi feature là một short-lived branch (≤ 2 ngày), bật/tắt bằng <em>feature flags</em>.</li></ol><p>Tiêu chí quyết định:</p><ul><li>Deploy ≥ 1 lần/ngày? → Trunk-based</li><li>Cần hỗ trợ nhiều bản phát hành song song (v3 và v4)? → Git Flow</li><li>Team junior chưa quen review nhanh? → Git Flow dễ dạy hơn</li></ul><p>Quan trọng hơn cả: <strong>quy ước rõ ràng + CI bắt buộc pass trước khi merge</strong>.</p>',
            },
            {
              id: 'an-git-1-2',
              authorEmail: 'mentor.minh@itss.local',
              content:
                '<p>Bổ sung từ góc nhìn DevOps: nếu chọn Trunk-based bạn <strong>bắt buộc</strong> phải có 3 thứ:</p><ol><li>CI pipeline ≤ 10 phút (unit test + lint + build).</li><li>Feature flags (LaunchDarkly, hoặc tự build bằng env var) để merge code chưa "release" mà không ảnh hưởng người dùng.</li><li>Automated rollback (blue/green hoặc canary).</li></ol><p>Thiếu 1 trong 3 thì Trunk-based sẽ thành "cowboy commit". Lúc đó Git Flow an toàn hơn dù chậm.</p>',
            },
            {
              id: 'an-git-1-3',
              authorEmail: 'bob@student.local',
              isAnonymous: true,
              content:
                '<p>Mình từng làm intern ở chỗ áp Git Flow nhưng không có CI — kết quả là <code>develop</code> luôn vỡ. Đồng ý với anh Minh: quy trình chỉ work nếu có tooling đi kèm.</p>',
            },
          ],
        },
        {
          id: 'th-git-2',
          title: 'Conventional Commits — viết commit message thế nào cho "pro"?',
          authorEmail: 'chi@student.local',
          tags: ['commit-message', 'convention', 'changelog'],
          content:
            '<p>Em mới được merge PR đầu tiên thì bị reviewer nhắc: <em>"commit message không theo convention"</em>. Anh chị giải thích giúp em <strong>Conventional Commits</strong> là gì, vì sao team lại quan trọng nó đến vậy?</p>',
          answers: [
            {
              id: 'an-git-2-1',
              authorEmail: 'mentor.tuan@itss.local',
              accepted: true,
              content:
                '<p><strong>Conventional Commits</strong> là chuẩn viết commit có cấu trúc:</p><pre><code>&lt;type&gt;(&lt;scope&gt;): &lt;subject&gt;\n\n&lt;body&gt;\n\n&lt;footer&gt;</code></pre><p>Ví dụ:</p><pre><code>feat(auth): thêm đăng nhập bằng Google OAuth\n\nDùng next-auth v5, bỏ flow cũ với passport.\nCloses #234</code></pre><p>Các <code>type</code> phổ biến: <code>feat</code>, <code>fix</code>, <code>docs</code>, <code>refactor</code>, <code>test</code>, <code>chore</code>, <code>perf</code>, <code>ci</code>.</p><p><strong>Lợi ích trong doanh nghiệp:</strong></p><ul><li>Tự sinh <em>CHANGELOG.md</em> qua tool như <code>semantic-release</code>.</li><li>Tự bump version (feat = minor, fix = patch, BREAKING CHANGE = major).</li><li>Filter <code>git log --grep="^fix"</code> ra ngay danh sách bug fix cho release notes.</li><li>Reviewer scan PR nhanh hơn ×3.</li></ul><p>Setup: cài <code>commitlint</code> + <code>husky</code> để block commit sai chuẩn ngay tại máy dev.</p>',
            },
            {
              id: 'an-git-2-2',
              authorEmail: 'mentor.huong@itss.local',
              content:
                '<p>Một mẹo nhỏ: <strong>subject ≤ 50 ký tự, viết ở thì mệnh lệnh</strong> (<em>"add login"</em> chứ không phải <em>"added login"</em>). Cảm thấy hơi cứng nhắc nhưng khi đọc <code>git log --oneline</code> bạn sẽ biết ơn quy ước này.</p>',
            },
          ],
        },
        {
          id: 'th-git-3',
          title: 'Quy trình review pull request ở công ty lớn diễn ra như thế nào?',
          authorEmail: 'duc@student.local',
          tags: ['pull-request', 'code-review', 'process'],
          content:
            '<p>Em chuẩn bị onboard tại một MNC. Em đã viết code khá ổn ở trường nhưng chưa bao giờ trải qua một vòng code review "thật". Quy trình một PR từ lúc tạo đến lúc merge điển hình ở công ty lớn gồm những bước gì ạ?</p>',
          answers: [
            {
              id: 'an-git-3-1',
              authorEmail: 'mentor.khoi@itss.local',
              accepted: true,
              content:
                '<p>Ở Shopee, một PR điển hình đi qua các bước:</p><ol><li><strong>Self-review</strong>: dev tự đọc lại diff trước khi gắn người review. Bắt buộc.</li><li><strong>CI checks</strong>: lint, unit test, integration test, security scan (SAST), build artifact. PR đỏ là KHÔNG ai review.</li><li><strong>Code Owners</strong>: file <code>CODEOWNERS</code> tự gán reviewer theo module. PR của bạn có thể cần 2 approvers (1 trong team, 1 ngoài team nếu đụng shared lib).</li><li><strong>Review iterations</strong>: 2–3 vòng comment + push fix là bình thường. Đừng force-push <code>main</code>; <code>git commit --fixup</code> hoặc thêm commit thường rồi squash-merge.</li><li><strong>Merge strategy</strong>: chúng tôi dùng <em>squash & merge</em> để giữ history sạch.</li><li><strong>Post-merge</strong>: CD tự deploy lên staging; bạn cần monitor dashboard 10 phút đầu để bắt regressions.</li></ol><p>Lời khuyên cho intern:</p><ul><li>PR <strong>nhỏ</strong> (≤ 400 dòng diff) sẽ được review nhanh hơn ×5.</li><li>Mô tả PR luôn có <em>What / Why / How to test</em>.</li><li>Đừng tự ái khi nhận comment — coi nó là free mentorship.</li></ul>',
            },
            {
              id: 'an-git-3-2',
              authorEmail: 'mentor.tuan@itss.local',
              content:
                '<p>Bổ sung mẫu PR description mình bắt team dùng:</p><pre><code>## What\nChuyển auth từ passport sang next-auth v5.\n\n## Why\n- passport không hỗ trợ App Router\n- giảm 12kb bundle\n\n## How to test\n1. npm run dev\n2. Vào /login, đăng nhập Google\n3. Verify session ở /api/me\n\n## Screenshots\n[ảnh]\n\n## Checklist\n- [x] unit test\n- [x] update docs\n- [ ] migration notes (none)</code></pre><p>Template này tiết kiệm cho reviewer rất nhiều thời gian.</p>',
            },
          ],
        },
        {
          id: 'th-git-4',
          title: 'Xử lý merge conflict ở nhánh dài hơi — nên rebase hay merge?',
          authorEmail: 'ha@student.local',
          tags: ['rebase', 'merge', 'conflict'],
          content:
            '<p>Em có một feature branch sống được ~10 ngày, giờ phải đồng bộ với <code>main</code>. Quan điểm nội bộ team đang chia phe: nửa muốn <code>git rebase main</code>, nửa muốn <code>git merge main</code>. Anh chị tư vấn?</p>',
          answers: [
            {
              id: 'an-git-4-1',
              authorEmail: 'mentor.linh@itss.local',
              accepted: true,
              content:
                '<p>Nguyên tắc của mình:</p><ul><li><strong>Rebase</strong> với nhánh <em>local / chưa share</em> để giữ history thẳng đẹp.</li><li><strong>Merge</strong> với nhánh <em>đã share với người khác</em> — rebase sẽ rewrite history, đồng nghiệp pull về sẽ vỡ.</li></ul><p>Với nhánh 10 ngày của bạn, nếu chỉ mình bạn làm: <code>git fetch && git rebase origin/main</code> rồi <code>git push --force-with-lease</code> (KHÔNG dùng <code>--force</code> trần — sẽ ghi đè commit của người khác nếu có).</p><p>Trick xử conflict đỡ đau:</p><ol><li>Đừng để feature branch sống quá 3 ngày. Rebase mỗi ngày, mỗi lần chỉ vài conflict nhỏ.</li><li>Cài <code>git rerere</code> (<em>reuse recorded resolution</em>) — Git nhớ cách bạn giải quyết conflict.</li><li>Conflict to → dùng IDE merge tool (VSCode, IntelliJ) thay vì nano.</li></ol>',
            },
            {
              id: 'an-git-4-2',
              authorEmail: 'mentor.minh@itss.local',
              content:
                '<p>Quy tắc bất di bất dịch trong team mình: <strong>không bao giờ rebase nhánh public</strong> (<code>main</code>, <code>develop</code>). Nhánh feature của riêng bạn thì rebase thoải mái.</p>',
            },
          ],
        },
        {
          id: 'th-git-5',
          title: 'Lỡ commit secret (.env, API key) lên GitHub rồi — cứu sao?',
          authorEmail: 'long@student.local',
          tags: ['security', 'secret', 'incident'],
          content:
            '<p>Em vô tình commit file <code>.env</code> chứa AWS key và push lên repo public ~30 phút trước khi nhận ra. Em phải làm gì ngay bây giờ? Xóa commit có đủ không?</p>',
          answers: [
            {
              id: 'an-git-5-1',
              authorEmail: 'mentor.an@itss.local',
              accepted: true,
              content:
                '<p><strong>Xóa commit KHÔNG đủ</strong>. Bot scanner quét GitHub public 24/7, key của bạn có thể đã bị thu thập. Quy trình ứng cứu theo đúng thứ tự:</p><ol><li><strong>Revoke / rotate ngay</strong>: vào AWS IAM disable key đó, tạo key mới. Tương tự cho mọi secret khác trong file.</li><li><strong>Kiểm tra audit log</strong>: AWS CloudTrail xem có API call lạ từ IP không quen không. Nếu có → escalate ngay (xem chiều sâu truy cập).</li><li><strong>Xóa khỏi history</strong> bằng <code>git filter-repo</code> (<code>filter-branch</code> đã deprecated) hoặc BFG Repo-Cleaner, force-push.</li><li><strong>Thêm <code>.gitignore</code></strong>: <code>.env</code>, <code>.env.local</code>, <code>*.pem</code>, <code>credentials.json</code>...</li><li><strong>Phòng ngừa</strong>: cài <code>gitleaks</code> hoặc <code>trufflehog</code> pre-commit hook, bật GitHub Secret Scanning + Push Protection cho repo.</li></ol><p>Lần sau dùng <strong>secret manager</strong> (AWS Secrets Manager, Doppler, 1Password CLI) thay vì file <code>.env</code> trong repo.</p>',
            },
            {
              id: 'an-git-5-2',
              authorEmail: 'mentor.minh@itss.local',
              content:
                '<p>Thêm: nếu repo là organization trả phí, bật <em>GitHub Advanced Security</em>. Nó chặn push có secret ngay trước khi vào server — cứu nhiều trường hợp suyên tự.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 2. QUY TRÌNH SCRUM & AGILE
    // ====================================================================
    {
      name: 'Scrum, Agile & Quản lý dự án',
      slug: 'scrum-agile-process',
      category: 'PROCESS_SCRUM',
      tags: ['scrum', 'agile', 'jira', 'sprint', 'standup'],
      description:
        'Sprint planning, daily standup, retro, estimate story point, dùng Jira/Trello sao cho hiệu quả. Khoảng cách lớn nhất giữa sinh viên và doanh nghiệp không nằm ở code mà ở quy trình.',
      threads: [
        {
          id: 'th-scrum-1',
          title: 'Daily standup chỉ 15 phút — nói gì cho đúng?',
          authorEmail: 'alice@student.local',
          tags: ['standup', 'daily', 'intern'],
          content:
            '<p>Em mới onboard, mỗi ngày 9h sáng team đứng lên họp. Em sợ nói lan man, sợ nói tiếng Việt lẫn tiếng Anh ngại. Có template "chuẩn" cho intern không ạ?</p>',
          answers: [
            {
              id: 'an-scrum-1-1',
              authorEmail: 'mentor.huong@itss.local',
              accepted: true,
              content:
                '<p>Standup chỉ trả lời 3 câu, mỗi câu ≤ 30 giây:</p><ol><li><strong>Hôm qua mình đã làm gì</strong> liên quan đến sprint goal.</li><li><strong>Hôm nay mình sẽ làm gì.</strong></li><li><strong>Mình có blocker nào không.</strong></li></ol><p>Ví dụ:</p><blockquote><p>"Hôm qua em fix xong ticket TKT-123 về validate email, đã merge. Hôm nay em sẽ pick TKT-130 về API forgot-password, kế hoạch xong trong 2 ngày. Em đang vướng vì chưa có credential SMTP staging, anh DevOps hỗ trợ giúp em sau standup được không ạ?"</p></blockquote><p>Cảnh báo: standup <strong>không phải</strong> status report cho sếp. Nó là sync ngang giữa team. Nói cho đồng đội biết bạn đang ở đâu để họ unblock.</p>',
            },
            {
              id: 'an-scrum-1-2',
              authorEmail: 'mentor.thao@itss.local',
              content:
                '<p>Tip nhỏ cho intern hơi ngại: viết trước 3 dòng trên Slack/Notion 5 phút trước standup. Đọc lại khi đến lượt → tự tin, ngắn gọn, không quên blocker.</p>',
            },
          ],
        },
        {
          id: 'th-scrum-2',
          title: 'Story point khác giờ công như thế nào? Estimate sao cho không "lệch"?',
          authorEmail: 'duc@student.local',
          tags: ['estimation', 'story-point', 'planning'],
          content:
            '<p>Sprint planning team em hay tranh cãi 1 ticket "3 hay 5 point". Em chưa hiểu story point đo cái gì, sao không estimate luôn bằng giờ?</p>',
          answers: [
            {
              id: 'an-scrum-2-1',
              authorEmail: 'mentor.huong@itss.local',
              accepted: true,
              content:
                '<p>Story point là đơn vị <strong>tương đối</strong>, phản ánh 3 yếu tố:</p><ul><li><strong>Complexity</strong> (độ phức tạp logic).</li><li><strong>Effort</strong> (lượng công).</li><li><strong>Uncertainty / Risk</strong> (chưa rõ requirement, công nghệ mới...).</li></ul><p>Vì sao không dùng giờ?</p><ol><li>Giờ thì người này 4h, người kia 8h — không so sánh được.</li><li>Giờ tạo áp lực chính trị ("sao 2 ngày mà chưa xong"). Story point trừu tượng hơn nên team thoải mái thảo luận.</li><li>Velocity (point/sprint) ổn định sau 3–4 sprint sẽ giúp PO dự đoán roadmap.</li></ol><p>Quy ước phổ biến (Fibonacci): 1, 2, 3, 5, 8, 13. Ticket > 8 → <strong>tách nhỏ</strong>, không "ép" 13.</p><p>Khi tranh cãi "3 hay 5": dùng <em>planning poker</em>. Người estimate cao và thấp nhất giải thích. Thường người estimate cao đã nhìn thấy edge case mà người estimate thấp chưa thấy → cuộc tranh luận này chính là giá trị của planning.</p>',
            },
            {
              id: 'an-scrum-2-2',
              authorEmail: 'mentor.hieu@itss.local',
              content:
                '<p>Đừng "đối chiếu" point giữa các team. Velocity 30 của team A không giỏi gấp đôi team B velocity 15 — họ chỉ scale khác nhau. Đây là lỗi mình thấy management hay mắc.</p>',
            },
          ],
        },
        {
          id: 'th-scrum-3',
          title: 'Retro toàn "tốt lắm anh em" — làm sao để retro có ích?',
          authorEmail: 'chi@student.local',
          tags: ['retrospective', 'team-culture'],
          content:
            '<p>Sprint nào retro của team em cũng chỉ ra 1–2 điểm chung chung như "communication tốt", "deliver đúng hẹn". Không thấy action item nào cụ thể. Em làm Scrum Master tạm thay quý này, em nên thay đổi sao ạ?</p>',
          answers: [
            {
              id: 'an-scrum-3-1',
              authorEmail: 'mentor.huong@itss.local',
              accepted: true,
              content:
                '<p>Triệu chứng bạn mô tả gọi là <em>"retro mệt mỏi"</em>. Vài cách thử:</p><ol><li><strong>Đổi format mỗi sprint</strong>: Start/Stop/Continue, Mad/Sad/Glad, 4Ls (Liked/Learned/Lacked/Longed for), Sailboat...</li><li><strong>Anonymous input trước meeting</strong> (Miro, Retrium, hoặc Google Form). Mọi người viết thật hơn khi không lộ danh tính.</li><li><strong>Giới hạn 2 action item</strong> mỗi retro. Mỗi action có <em>owner + deadline</em>. Mở đầu retro sau, review action sprint trước. Không follow-up = retro thành lễ hội.</li><li><strong>Tâm lý an toàn</strong>: Scrum Master nói trước "không có lỗi cá nhân, chỉ có lỗi process". Một câu vậy thôi cũng mở khoá rất nhiều.</li></ol><p>Action item ví dụ tốt: <em>"Anh A viết tài liệu setup môi trường staging trước thứ 6"</em>. Tệ: <em>"Cải thiện communication"</em>.</p>',
            },
          ],
        },
        {
          id: 'th-scrum-4',
          title: 'Onboarding intern tuần đầu — như thế nào là "ổn"?',
          authorEmail: 'my@student.local',
          tags: ['onboarding', 'intern', 'first-week'],
          content:
            '<p>Em vừa nhận offer intern. Tuần đầu để được đánh giá tốt em nên làm gì, tránh gì? Tâm lý em đang hơi sợ bị "xử lý" vì chưa quen tooling.</p>',
          answers: [
            {
              id: 'an-scrum-4-1',
              authorEmail: 'mentor.duy@itss.local',
              accepted: true,
              content:
                '<p>Làm EM gần 6 năm, mình quan sát intern "ấn tượng" đều có mấy điểm chung tuần đầu:</p><ol><li><strong>Viết "Onboarding Doc" cho chính mình</strong>: mỗi bước setup, lỗi gặp, cách fix. Kết tuần submit cho mentor. Đây là món quà cho intern kế tiếp — EM sẽ nhớ bạn.</li><li><strong>Hỏi nhiều, hỏi đúng người</strong>. Quy tắc 30 phút: tự google + thử 30\' chưa ra thì hỏi. Đừng ngồi stuck cả ngày.</li><li><strong>Lấy 1 ticket nhỏ nhất merge được trong tuần 1</strong> (typo, doc, refactor nhỏ). Thổi nhẹ confidence + chứng minh bạn biết luyển PR/CI/review flow.</li><li><strong>1-1 với mentor</strong>: chủ động đặt lịch, chuẩn bị 3 câu hỏi trước.</li><li><strong>Ghi chú mọi người bạn gặp</strong> (tên, vai trò, team). Tuần 2 bạn sẽ không bối rối khi gặp lại.</li></ol><p>Điều tránh: im lặng 5 ngày vì "ngại làm phiền". Đó mới là red flag lớn nhất.</p>',
            },
            {
              id: 'an-scrum-4-2',
              authorEmail: 'mentor.huong@itss.local',
              content:
                '<p>Thêm: tuần đầu đừng cố "prove yourself" bằng cách overcommit. Estimate không nổi 1 sprint là bình thường với fresher. Honest > heroic.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 3. NGHỀ NGHIỆP & PHỎNG VẤN
    // ====================================================================
    {
      name: 'Định hướng nghề nghiệp & Phỏng vấn',
      slug: 'career-interview',
      category: 'CAREER',
      tags: ['career', 'interview', 'cv', 'resume', 'leveling'],
      description:
        'CV, system design interview, behavioral interview, lộ trình junior → senior → tech lead. Câu chuyện thật từ những người đã đi qua.',
      threads: [
        {
          id: 'th-cv-1',
          title: 'CV sinh viên năm 3 chưa có kinh nghiệm thì viết gì?',
          authorEmail: 'alice@student.local',
          tags: ['cv', 'resume', 'fresher'],
          content:
            '<p>Em sắp apply intern. CV em hiện tại chỉ có: trường, GPA, vài bài tập lớn, chứng chỉ TOEIC. Em thấy quá mỏng. Mọi người gợi ý em có thể bổ sung gì để CV "dày" lên một cách thật chất?</p>',
          answers: [
            {
              id: 'an-cv-1-1',
              authorEmail: 'mentor.hieu@itss.local',
              accepted: true,
              content:
                '<p>Recruiter dành ~7 giây cho một CV. Cấu trúc mình recommend cho fresher:</p><ol><li><strong>Tóm tắt 2 dòng</strong>: vai trò bạn nhắm tới + 2 thế mạnh nổi bật. Ví dụ: <em>"Sinh viên năm 3 BKHN, có 2 dự án Next.js + Postgres đã deploy lên Vercel, đang tìm internship Frontend."</em></li><li><strong>Projects (phần quan trọng nhất với fresher)</strong>: 2-3 dự án, mỗi cái nêu rõ:<ul><li>Vấn đề giải quyết (1 câu).</li><li>Tech stack + vai trò của bạn.</li><li>Kết quả đo được (số liệu, link demo, link GitHub).</li></ul></li><li><strong>Open-source contribution</strong>: 1 PR được merge vào repo public > 10 bài tập lớn. Đề xuất: tìm <code>good first issue</code> trên các project bạn đã dùng.</li><li><strong>Học vấn, chứng chỉ, hoạt động</strong>: gọn, 4 dòng.</li></ol><p>Đừng làm:</p><ul><li>Liệt kê 25 ngôn ngữ ("biết cơ bản Java, C, C++, Python, JS, TS..."). Recruiter biết bạn chưa giỏi cái nào cả.</li><li>Hình ảnh, màu mè, biểu đồ % skill. Trừ khi bạn apply designer.</li><li>Khai man — review hỏi thẳng là lộ ngay.</li></ul>',
            },
            {
              id: 'an-cv-1-2',
              authorEmail: 'mentor.tuan@itss.local',
              content:
                '<p>Một mẹo "ăn gian" chính đáng: viết blog kỹ thuật. Mỗi tuần 1 bài về thứ bạn vừa học. Sau 3 tháng bạn có 1 portfolio sống + chứng minh khả năng giao tiếp kỹ thuật. Cực kỳ ăn điểm với interviewer.</p>',
            },
            {
              id: 'an-cv-1-3',
              authorEmail: 'mentor.huong@itss.local',
              content:
                '<p>Nhấn mạnh thêm phần <strong>kết quả đo được</strong>. Thay vì <em>"Làm website bán hàng với React"</em> hãy viết <em>"Xây dựng web bán hàng React + Stripe, deploy Vercel, đạt 200 user thật trong 1 tháng, Lighthouse 95+"</em>. Câu sau gấp 10 lần câu trước.</p>',
            },
          ],
        },
        {
          id: 'th-cv-2',
          title: 'Phỏng vấn behavior — câu "điểm yếu của bạn là gì" trả lời sao?',
          authorEmail: 'ha@student.local',
          tags: ['behavioral', 'interview', 'soft-skill'],
          content:
            '<p>Câu này em nghe hoài, đáp án "tôi cầu toàn quá" thì sến. Nhưng đáp án thật ("em hay trì hoãn") thì sợ bị loại. Mọi người thường trả lời thế nào ạ?</p>',
          answers: [
            {
              id: 'an-cv-2-1',
              authorEmail: 'mentor.hieu@itss.local',
              accepted: true,
              content:
                '<p>Cấu trúc <strong>S-T-A-R-L</strong> (Situation-Task-Action-Result-Learn):</p><ol><li>Chọn một điểm yếu <em>thật</em> nhưng <em>không chí mạng</em> cho vai trò bạn apply. Apply Backend thì đừng chọn "ngại đọc code Java".</li><li>Kể tình huống cụ thể nó từng gây vấn đề.</li><li>Quan trọng nhất: kể <strong>bạn đã làm gì để khắc phục</strong> và kết quả ra sao.</li></ol><p>Ví dụ:</p><blockquote><p>"Điểm yếu của em là estimate thường quá lạc quan, hay underestimate effort. Hồi BTL học kỳ trước em commit 1 module trong 3 ngày, kết quả mất 6. Sau đó em bắt đầu chia mỗi task thành các sub-task ≤ 2h, viết ra giấy rồi cộng lại. Áp dụng được 4 tháng, estimate gần đây của em lệch < 20%, team đỡ stress hơn nhiều."</p></blockquote><p>Interviewer không tìm người hoàn hảo. Họ tìm người <strong>tự nhận thức + biết tự cải thiện</strong>.</p>',
            },
          ],
        },
        {
          id: 'th-cv-3',
          title: 'System Design interview cho fresher — có bị hỏi không và chuẩn bị sao?',
          authorEmail: 'phuc@student.local',
          tags: ['system-design', 'interview', 'fresher'],
          content:
            '<p>Em đang phỏng vấn cho vị trí Junior Backend tại 1 công ty product top. Em nghe đồn có vòng system design. Fresher cũng bị hỏi thật sao? Chuẩn bị thế nào trong 4 tuần?</p>',
          answers: [
            {
              id: 'an-cv-3-1',
              authorEmail: 'mentor.khoi@itss.local',
              accepted: true,
              content:
                '<p>Có bị hỏi, nhưng <strong>đánh giá mức khác senior</strong>. Với fresher, interviewer muốn thấy:</p><ul><li>Bạn biết đặt câu hỏi clarify (functional / non-functional requirements).</li><li>Biết vẽ các box cơ bản: client — LB — app — cache — DB.</li><li>Hiểu trade-off cơ bản: SQL vs NoSQL, cache invalidation, sync vs async.</li><li>Dám nói "em chưa biết, em đoán là X vì...".</li></ul><p>Lộ trình 4 tuần:</p><ol><li><strong>Tuần 1</strong>: đọc <em>System Design Primer</em>, nắm 10 concept gốc: latency vs throughput, CAP, consistency level, indexing, sharding, replication, queue, CDN, rate limit, idempotency.</li><li><strong>Tuần 2</strong>: xem 5 video ByteByteGo (URL shortener, chat app, news feed, notification, rate limiter).</li><li><strong>Tuần 3</strong>: <strong>tự vẽ</strong> 5 bài trên Excalidraw, kể về thiết kế cho 1 người bạn trong 30 phút. Quay video tự review.</li><li><strong>Tuần 4</strong>: mock interview 3 lần (Pramp / friend). Nhận feedback, chỉnh.</li></ol><p>Mẹo: đừng nhảy vào vẽ ngay. Dành 5 phút đầu clarify, 10 phút estimate scale (QPS, storage), rồi mới vẽ. Interviewer sẽ ấn tượng với <em>process</em> hơn là đáp án đúng.</p>',
            },
            {
              id: 'an-cv-3-2',
              authorEmail: 'mentor.hieu@itss.local',
              content:
                '<p>+1 cho clarify. Mình interview ~200 candidate — candidate "jump to solution" sau 30 giây thường rớt, còn candidate hỏi lại "users có ở nhiều region không?" là đã ghi điểm.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 4. FRONTEND
    // ====================================================================
    {
      name: 'Frontend, React & Next.js',
      slug: 'frontend-react',
      category: 'FRONTEND',
      tags: ['react', 'nextjs', 'typescript', 'tailwind'],
      description: 'Mọi thứ Frontend hiện đại: React Server Components, performance, design system, state management.',
      threads: [
        {
          id: 'th-fe-1',
          title: 'Khi nào dùng Server Components vs Client Components?',
          authorEmail: 'alice@student.local',
          tags: ['nextjs', 'rsc', 'app-router'],
          content:
            '<p>Em đang học Next.js 15 App Router. Chưa rõ khi nào dùng RSC, khi nào thêm <code>"use client"</code>. Mọi người tư vấn giúp em với?</p>',
          answers: [
            {
              id: 'an-fe-1-1',
              authorEmail: 'mentor.tuan@itss.local',
              accepted: true,
              content:
                '<p>Quy tắc của mình:</p><ul><li><strong>Mặc định Server Component</strong>. Giảm JS gửi xuống browser, render gần dữ liệu (DB / API), bảo mật secrets.</li><li>Chuyển sang Client chỉ khi bạn cần một trong 4 thứ:<ol><li>Hook React (<code>useState</code>, <code>useEffect</code>, <code>useReducer</code>...).</li><li>Browser API (<code>window</code>, <code>localStorage</code>, <code>IntersectionObserver</code>).</li><li>Event handler (<code>onClick</code>, <code>onChange</code>...).</li><li>Class component / third-party lib chỉ có client.</li></ol></li></ul><p>Pattern hay dùng: <strong>Server Component fetch data → truyền props xuống Client Component nhỏ</strong> chỉ chứa phần interactive (form, dropdown). Vẫn tận dụng RSC streaming nhưng có tương tác.</p><p>Sai lầm phổ biến: bọc cả page bằng <code>"use client"</code> → mất hết lợi ích của App Router.</p>',
            },
            {
              id: 'an-fe-1-2',
              authorEmail: 'bob@student.local',
              isAnonymous: true,
              content:
                '<p>Mình từng học sai như anh Tuấn nói — gắn <code>"use client"</code> ở layout chính. Lighthouse rớt 40 điểm. Đừng làm vậy 😅</p>',
            },
          ],
        },
        {
          id: 'th-fe-2',
          title: 'TanStack Query vs RTK Query vs SWR — chọn cái nào cho dự án mới?',
          authorEmail: 'duc@student.local',
          tags: ['data-fetching', 'state', 'react-query'],
          content:
            '<p>Team em sắp khởi tạo dự án React mới. Mọi người đang phân vân giữa TanStack Query, RTK Query và SWR. Tiêu chí nào để chọn ạ?</p>',
          answers: [
            {
              id: 'an-fe-2-1',
              authorEmail: 'mentor.tuan@itss.local',
              accepted: true,
              content:
                '<p>Tóm tắt:</p><ul><li><strong>TanStack Query</strong>: best-in-class, API trực quan, devtools tốt, tài liệu xịn. Không bị buộc vào Redux. → <em>Default choice cho dự án mới</em>.</li><li><strong>RTK Query</strong>: hợp nếu bạn đã dùng Redux Toolkit cho global state. Code generation từ OpenAPI rất ngon.</li><li><strong>SWR</strong>: nhẹ, đơn giản. Của Vercel, integrate Next.js mượt. Phù hợp dự án nhỏ.</li></ul><p>Câu hỏi quyết định: <em>"Bạn có cần Redux không?"</em></p><ul><li>Có → RTK + RTK Query.</li><li>Không → TanStack Query (90% dự án hiện đại).</li></ul>',
            },
          ],
        },
        {
          id: 'th-fe-3',
          title: 'Performance Next.js — những "quả ngọt" đầu tiên nên hái?',
          authorEmail: 'quynh@student.local',
          tags: ['performance', 'nextjs', 'web-vitals'],
          content:
            '<p>Trang Next.js của em LCP ~4.2s, Lighthouse 62. Không biết bắt đầu tối ưu từ đâu. Mọi người chỉ cho em 80/20 rule được không?</p>',
          answers: [
            {
              id: 'an-fe-3-1',
              authorEmail: 'mentor.tuan@itss.local',
              accepted: true,
              content:
                '<p>5 "quả ngọt" cho ra 80% kết quả:</p><ol><li><strong>Dùng <code>next/image</code></strong> thay <code>&lt;img&gt;</code>. Tự responsive + lazy + AVIF/WebP. Một mình nó cứu LCP cho 70% site.</li><li><strong>Dùng <code>next/font</code></strong> — self-host font, bỏ <code>@import</code> Google Fonts. Bỏ 1–2 round-trip.</li><li><strong>Dynamic import</strong> cho component nặng không above-the-fold (chart, editor, modal): <code>dynamic(() =&gt; import("./Chart"), { ssr: false })</code>.</li><li><strong>Audit bundle</strong>: <code>@next/bundle-analyzer</code>. Tìm dependency thừa (moment.js 70kb → thay date-fns 5kb).</li><li><strong>Cache headers</strong> cho asset (Next.js tự đặt immutable 1 năm cho file có hash). Static page dùng <code>revalidate</code> thay vì <code>force-dynamic</code> nếu không cần.</li></ol><p>Đo lại bằng Lighthouse + WebPageTest sau mỗi bước. Đừng tối ưu mò — đo, fix, đo.</p>',
            },
            {
              id: 'an-fe-3-2',
              authorEmail: 'mentor.bich@itss.local',
              content:
                '<p>Bổ sung: chuẩn bị perf budget trước (vd LCP < 2.5s, JS < 200kb) và gắn vào CI bằng Lighthouse CI. Tránh "performance regress" 6 tháng sau lại quay lại vạch xuất phát.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 5. BACKEND
    // ====================================================================
    {
      name: 'Backend & API Design',
      slug: 'backend-api',
      category: 'BACKEND',
      tags: ['nodejs', 'nestjs', 'go', 'postgres', 'rest', 'graphql'],
      description: 'REST vs GraphQL, schema design, transaction, query optimization, error handling chuẩn doanh nghiệp.',
      threads: [
        {
          id: 'th-be-1',
          title: 'Validate input ở layer nào — controller, service hay DB?',
          authorEmail: 'chi@student.local',
          tags: ['validation', 'architecture', 'best-practice'],
          content:
            '<p>Em đọc các best practice, mỗi nguồn nói một kiểu. Có người bảo validate ở controller (DTO), có người bảo service phải tự validate vì có thể được gọi từ nhiều entry point. Mọi người làm sao trong thực tế ạ?</p>',
          answers: [
            {
              id: 'an-be-1-1',
              authorEmail: 'mentor.khoi@itss.local',
              accepted: true,
              content:
                '<p>Câu trả lời ngắn: <strong>cả hai, nhưng làm những việc khác nhau</strong>.</p><ul><li><strong>Controller / DTO</strong>: validate <em>shape</em> — required, type, length, regex format. Đây là "lá chắn ngoài".</li><li><strong>Service / domain layer</strong>: validate <em>business rule</em> — ví dụ "email chưa tồn tại trong DB", "số dư đủ trả phí", "user có quyền update bản ghi này". Service KHÔNG tin DTO; nhiều entry point (CLI, message queue, internal API) có thể bypass controller.</li><li><strong>Database</strong>: <em>constraint cuối cùng</em> — NOT NULL, UNIQUE, FK, CHECK. Không bao giờ tin layer trên 100%.</li></ul><p>Đừng nhồi tất cả vào 1 chỗ. Mỗi layer bảo vệ giả định riêng của nó.</p>',
            },
            {
              id: 'an-be-1-2',
              authorEmail: 'mentor.linh@itss.local',
              content:
                '<p>Bổ sung: dùng <strong>Zod</strong> (TS) hoặc <strong>class-validator</strong> (NestJS) cho DTO. Cho business rule trong service, tạo các <em>custom error class</em> rõ ràng (<code>InsufficientBalanceError</code>) để controller dịch ra HTTP status đúng.</p>',
            },
          ],
        },
        {
          id: 'th-be-2',
          title: 'N+1 query — tại sao team senior cứ "ám ảnh" với cái này?',
          authorEmail: 'bob@student.local',
          tags: ['performance', 'orm', 'database'],
          content:
            '<p>Em mới bị reviewer reject PR vì "có N+1 query". Em đọc thì hiểu là chạy 1 query lấy list, rồi mỗi item lại 1 query lấy relation. Nhưng tại sao nguy hiểm đến vậy?</p>',
          answers: [
            {
              id: 'an-be-2-1',
              authorEmail: 'mentor.linh@itss.local',
              accepted: true,
              content:
                '<p>Hãy tưởng tượng: API <code>GET /posts</code> trả 50 bài viết, mỗi bài cần kèm tên author.</p><ul><li>Code N+1: 1 query lấy 50 posts → 50 query <code>SELECT * FROM users WHERE id = ?</code> → tổng 51 query.</li><li>Mỗi round-trip DB ≈ 1ms (local) hoặc 5–20ms (cloud cross-AZ). 51 query có thể tốn 500ms+.</li><li>Khi traffic tăng, DB connection pool cạn → cả service nghẽn.</li></ul><p>Giải pháp tùy ORM:</p><ul><li>Prisma: <code>include: { author: true }</code> → 1 join.</li><li>SQLAlchemy: <code>joinedload(Post.author)</code>.</li><li>TypeORM: <code>relations: [\'author\']</code> hoặc QueryBuilder.</li></ul><p>Cách phát hiện sớm: bật query log ở dev, hoặc dùng tool như <code>prisma-query-log</code>, <code>django-debug-toolbar</code>. Nếu thấy số query tỉ lệ với số item → N+1.</p>',
            },
          ],
        },
        {
          id: 'th-be-3',
          title: 'REST vs GraphQL vs tRPC cho API nội bộ của một SaaS mới?',
          authorEmail: 'long@student.local',
          tags: ['api-design', 'rest', 'graphql', 'trpc'],
          content:
            '<p>Team em (Next.js + Node.js) đang chọn kỹ thuật API. Có người đề xuất tRPC vì "type-safe end-to-end". Mọi người tư vấn giúp?</p>',
          answers: [
            {
              id: 'an-be-3-1',
              authorEmail: 'mentor.linh@itss.local',
              accepted: true,
              content:
                '<p>3 câu hỏi quyết định:</p><ol><li><strong>API có phục vụ client bên ngoài (mobile, partner) không?</strong><br>Có → REST (chuẩn, ai cũng consume được) hoặc GraphQL.<br>Không → tRPC hoàn hảo.</li><li><strong>Team dùng TypeScript end-to-end?</strong><br>Có → tRPC tiết kiệm ~30% boilerplate, type-safe từ DB đến UI.<br>Không → tRPC mất lợi thế lớn nhất.</li><li><strong>Client cần query tùy biến ("lấy 3 fields này của user kèm 2 fields của posts")?</strong><br>Có → GraphQL (Relay-style). Thường đúng khi có nhiều client team khác nhau.</li></ol><p>Default cho Next.js + Node.js full-stack 1 team: <strong>tRPC</strong>. Muốn mở API public sau? Bọc thêm OpenAPI adapter, không chết.</p>',
            },
            {
              id: 'an-be-3-2',
              authorEmail: 'mentor.khoi@itss.local',
              content:
                '<p>+1. Cảnh báo nhỏ: GraphQL mở cho external = phải nghĩ đến query depth limit, persisted queries, DataLoader… chi phí vận hành không nhỏ như mọi người tưởng.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 6. DEVOPS
    // ====================================================================
    {
      name: 'DevOps, Cloud & SRE',
      slug: 'devops-cloud',
      category: 'DEVOPS',
      tags: ['docker', 'kubernetes', 'aws', 'ci-cd', 'terraform'],
      description: 'Docker, Kubernetes, AWS, observability, CI/CD pipeline thực tế từ các team production.',
      threads: [
        {
          id: 'th-do-1',
          title: 'Dockerfile multi-stage build — vì sao và viết thế nào?',
          authorEmail: 'duc@student.local',
          tags: ['docker', 'optimization', 'image-size'],
          content:
            '<p>Image Docker của team em ~1.2GB, deploy chậm. Senior bảo viết <strong>multi-stage build</strong>. Em chưa rõ cách viết, mọi người có ví dụ Node.js không ạ?</p>',
          answers: [
            {
              id: 'an-do-1-1',
              authorEmail: 'mentor.minh@itss.local',
              accepted: true,
              content:
                '<p>Multi-stage cho phép bạn <strong>build trong 1 image to (có dev deps) → copy output sang image nhỏ chỉ chứa runtime</strong>.</p><p>Ví dụ cho Next.js (giảm từ ~1GB xuống ~150MB):</p><pre><code># --- Stage 1: deps + build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# --- Stage 2: runtime\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\n# Copy đúng artifacts cần thiết\nCOPY --from=builder /app/.next/standalone ./\nCOPY --from=builder /app/.next/static ./.next/static\nCOPY --from=builder /app/public ./public\nEXPOSE 3000\nCMD ["node", "server.js"]</code></pre><p>Mẹo bonus:</p><ul><li>Dùng <code>.dockerignore</code> bỏ <code>node_modules</code>, <code>.git</code>, <code>.next</code>.</li><li>Tách <code>COPY package*.json ./</code> + <code>RUN npm ci</code> riêng để tận dụng cache khi chỉ code thay đổi.</li><li>Image distroless (Google) cho production cực nhỏ + ít CVE.</li></ul>',
            },
          ],
        },
        {
          id: 'th-do-2',
          title: 'CI/CD pipeline tối thiểu cho dự án Node.js + Postgres gồm những step nào?',
          authorEmail: 'ha@student.local',
          tags: ['ci-cd', 'github-actions', 'pipeline'],
          content:
            '<p>Em chuẩn bị setup GitHub Actions cho project tốt nghiệp. Mọi người gợi ý pipeline tối thiểu cho dự án Node.js + Postgres + deploy lên VPS giúp em?</p>',
          answers: [
            {
              id: 'an-do-2-1',
              authorEmail: 'mentor.minh@itss.local',
              accepted: true,
              content:
                '<p>Pipeline tối thiểu mình thường setup:</p><ol><li><strong>Lint</strong> (<code>eslint .</code>) — fail fast khi code style sai.</li><li><strong>Type check</strong> (<code>tsc --noEmit</code>).</li><li><strong>Unit tests</strong> với DB mock.</li><li><strong>Integration tests</strong> chạy với Postgres service trong GA workflow (<code>services: postgres:16</code>).</li><li><strong>Build</strong> Docker image, tag bằng commit SHA.</li><li><strong>Push image</strong> lên registry (GHCR / ECR).</li><li><strong>Deploy</strong>: SSH vào VPS, <code>docker compose pull && up -d</code>, hoặc dùng <code>watchtower</code> tự pull.</li><li><strong>Smoke test</strong> sau deploy: curl <code>/health</code>.</li></ol><p>Quy tắc: <strong>main</strong> luôn xanh. Mỗi push trên feature branch trigger các step 1–5. Step 6–8 chỉ chạy khi merge vào <code>main</code>.</p><p>Bonus: dùng <code>concurrency</code> trong GA để cancel build cũ khi push commit mới — tiết kiệm runtime miễn phí.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 7. DATA & AI
    // ====================================================================
    {
      name: 'Data, AI & MLOps',
      slug: 'data-ai-mlops',
      category: 'DATA_AI',
      tags: ['python', 'spark', 'airflow', 'llm', 'pytorch'],
      description: 'Data engineering, ML lifecycle, LLM application, vector DB, MLOps. Hỏi đáp từ kỹ sư đang làm production.',
      threads: [
        {
          id: 'th-ai-1',
          title: 'Lộ trình từ Web Dev chuyển sang Data Engineer cần học gì?',
          authorEmail: 'chi@student.local',
          tags: ['career-switch', 'data-engineering', 'roadmap'],
          content:
            '<p>Em đang làm Frontend, gần đây quan tâm data. Lộ trình hợp lý để chuyển sang Data Engineer trong 6–12 tháng cần học gì ạ?</p>',
          answers: [
            {
              id: 'an-ai-1-1',
              authorEmail: 'mentor.nga@itss.local',
              accepted: true,
              content:
                '<p>Lộ trình 6 tháng + 6 tháng:</p><p><strong>Pha 1 — Nền tảng (3 tháng):</strong></p><ul><li>SQL nâng cao: window function, CTE, query plan. Luyện trên LeetCode SQL hoặc StrataScratch.</li><li>Python cho data: pandas, type hints, async, viết script idempotent.</li><li>Mô hình hoá: dimensional modeling (Kimball), star vs snowflake schema, SCD type 2.</li></ul><p><strong>Pha 2 — Tooling production (3 tháng):</strong></p><ul><li>Airflow / Dagster — orchestration. Học cách viết DAG không state, idempotent task.</li><li>dbt — transformation chuẩn warehouse.</li><li>Một warehouse: Snowflake / BigQuery / Redshift.</li><li>Một message system: Kafka cơ bản.</li></ul><p><strong>Pha 3 — Portfolio (3 tháng):</strong></p><ul><li>End-to-end project: ingest data thật (vd: Spotify API) → S3/MinIO → dbt transform → BI dashboard (Metabase).</li><li>Viết blog 3 bài chi tiết. Apply junior DE.</li></ul><p>Frontend background của bạn là lợi thế: bạn quen với UX → có thể xây internal tool / dashboard cho stakeholder ngon hơn DE thuần.</p>',
            },
            {
              id: 'an-ai-1-2',
              authorEmail: 'mentor.giang@itss.local',
              content:
                '<p>Một góc nhìn khác: nếu bạn enjoy phần "build thông minh từ data" hơn "build pipeline", cân nhắc hướng <strong>ML/AI Engineer</strong> (gần với software hơn DE). Cùng nền SQL + Python nhưng tập trung vào model serving và evaluation.</p>',
            },
          ],
        },
        {
          id: 'th-ai-2',
          title: 'Xây app dùng LLM (RAG) — fresher cần biết những mảnh ghép gì?',
          authorEmail: 'viet@student.local',
          tags: ['llm', 'rag', 'vector-db'],
          content:
            '<p>Em muốn làm đồ án "chatbot hỏi đáp tài liệu nội bộ" dùng LLM. Em nghe nói tới RAG, vector DB, embedding mà chưa hình dung được bức tranh tổng thể. Anh chị vẽ giúp em với ạ?</p>',
          answers: [
            {
              id: 'an-ai-2-1',
              authorEmail: 'mentor.giang@itss.local',
              accepted: true,
              content:
                '<p><strong>RAG</strong> (Retrieval-Augmented Generation) gồm 2 pha:</p><p><strong>Pha index (offline):</strong></p><ol><li><strong>Chunk</strong>: cắt tài liệu thành đoạn ~300–800 token, có overlap.</li><li><strong>Embed</strong>: đưa từng chunk qua model embedding (OpenAI <code>text-embedding-3</code>, hoặc <code>bge-m3</code> open-source) → vector.</li><li><strong>Lưu vector</strong>: vào vector DB (pgvector, Qdrant, Pinecone).</li></ol><p><strong>Pha query (online):</strong></p><ol><li>Embed câu hỏi của user → vector.</li><li><strong>Retrieve</strong>: tìm top-k chunk gần nhất (cosine similarity).</li><li><strong>Augment</strong>: nhét các chunk đó vào prompt làm context.</li><li><strong>Generate</strong>: LLM trả lời <em>dựa trên</em> context → giảm bịa (hallucination), trích nguồn được.</li></ol><p>Lời khuyên cho đồ án:</p><ul><li>Bắt đầu với <strong>pgvector</strong> (chỉ là extension của Postgres bạn đã có) thay vì dựng Pinecone.</li><li>Chất lượng RAG phụ thuộc <strong>chunking + retrieval</strong> nhiều hơn là model. Đừng vội đổ lỗi cho LLM.</li><li>Luôn hiển thị <em>nguồn trích dẫn</em> — vừa tăng tin cậy, vừa dễ debug khi trả lời sai.</li></ul>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 8. MOBILE
    // ====================================================================
    {
      name: 'Mobile - iOS, Android, Flutter, React Native',
      slug: 'mobile-dev',
      category: 'MOBILE',
      tags: ['flutter', 'react-native', 'ios', 'android'],
      description: 'Cross-platform vs native, performance, publish app store, CI cho mobile.',
      threads: [
        {
          id: 'th-mb-1',
          title: 'Flutter hay React Native cho startup 1 dev đầu tiên?',
          authorEmail: 'duc@student.local',
          tags: ['flutter', 'react-native', 'startup'],
          content:
            '<p>Mình đang prototype một app cho startup. Chỉ có mình là dev. Backend đã có (Node.js). Nên chọn Flutter hay React Native?</p>',
          answers: [
            {
              id: 'an-mb-1-1',
              authorEmail: 'mentor.son@itss.local',
              accepted: true,
              content:
                '<p>Quyết định theo bối cảnh:</p><ul><li><strong>React Native</strong>: bạn đã giỏi React/TS → reuse skill, share code với web khả thi. Hệ sinh thái NPM khổng lồ. Nhược: build process còn lằng nhằng, UI native trên 2 nền tảng cần fine-tune.</li><li><strong>Flutter</strong>: UI cực kỳ consistent giữa iOS/Android (Skia tự render), DX rất mượt (hot reload), Dart dễ học. Nhược: phải học ngôn ngữ mới, package ecosystem ít hơn JS.</li></ul><p>Với startup 1 dev đã quen React → <strong>React Native + Expo</strong>. Expo bỏ 80% pain về build/deploy. Khi nào cần native module phức tạp mới eject.</p><p>Nếu bạn từ Java/Kotlin/Android background → Flutter sẽ nhanh hơn.</p>',
            },
          ],
        },
        {
          id: 'th-mb-2',
          title: 'Quy trình release app lên App Store / Play Store lần đầu cần lưu ý gì?',
          authorEmail: 'nhi@student.local',
          tags: ['release', 'app-store', 'play-store'],
          content:
            '<p>App đầu tay của em sắp xong. Em chưa từng submit lên store, nghe nói hay bị Apple reject. Mọi người chia sẻ checklist trước khi nộp giúp em với ạ?</p>',
          answers: [
            {
              id: 'an-mb-2-1',
              authorEmail: 'mentor.son@itss.local',
              accepted: true,
              content:
                '<p>Checklist từ kinh nghiệm submit hàng chục lần:</p><p><strong>Apple App Store (khó tính hơn):</strong></p><ol><li><strong>Privacy</strong>: khai báo đầy đủ data collection trong App Privacy. Có tài khoản? Phải có cách <em>xóa tài khoản</em> trong app (Apple bắt buộc từ 2022).</li><li><strong>Đăng nhập</strong>: nếu có login mạng xã hội (Google/Facebook) thì bắt buộc thêm <em>Sign in with Apple</em>.</li><li><strong>Demo account</strong>: cung cấp tài khoản test cho reviewer, nếu không họ reject ngay.</li><li><strong>Không "web wrapper"</strong>: app chỉ bọc website sẽ bị từ chối (guideline 4.2).</li></ol><p><strong>Google Play (dễ hơn nhưng vẫn cần):</strong></p><ul><li>Target API level mới nhất (Google cập nhật yêu cầu hàng năm).</li><li>Data Safety form khai đúng.</li><li>App đầu tiên thường bị review chậm 3–7 ngày (tài khoản mới bị soi kỹ).</li></ul><p>Mẹo: đọc kỹ rejection message — Apple ghi rõ guideline number. Đa số reject lần đầu là privacy / account deletion, fix nhanh là pass.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 9. BẢO MẬT ỨNG DỤNG
    // ====================================================================
    {
      name: 'Bảo mật ứng dụng & DevSecOps',
      slug: 'security-appsec',
      category: 'OTHER',
      tags: ['security', 'owasp', 'pentest', 'auth'],
      description:
        'OWASP Top 10, JWT vs session, OAuth, secret management, threat modeling. Dev nào cũng cần kiến thức bảo mật cơ bản, không chỉ team Security.',
      threads: [
        {
          id: 'th-sec-1',
          title: 'JWT hay session cookie cho web app mới?',
          authorEmail: 'phuc@student.local',
          tags: ['jwt', 'session', 'auth'],
          content:
            '<p>Em đọc nhiều bài bảo "JWT chỉ dùng khi cần thiết, mặc định nên dùng session cookie". Em chưa hiểu vì sao JWT lại bị "lệch trend". Cho em xin góc nhìn từ thực tế ạ.</p>',
          answers: [
            {
              id: 'an-sec-1-1',
              authorEmail: 'mentor.an@itss.local',
              accepted: true,
              content:
                '<p>Quy tắc đơn giản:</p><ul><li><strong>Session cookie (server-side session)</strong>: default cho web app monolith / SSR. Revoke ngay được (xóa record DB / Redis), nhỏ gọn, HttpOnly + Secure + SameSite chống XSS/CSRF tốt.</li><li><strong>JWT</strong>: hợp khi <em>cross-domain / nhiều microservice / mobile + web chia chung backend</em>. Stateless, scale ngang dễ. Nhược: <strong>không revoke được</strong> trước khi expire — phải tự build blacklist (làm mất luôn lợi thế stateless).</li></ul><p>Anti-pattern: nhồi JWT vào <code>localStorage</code> → XSS đọc trộm. Nếu phải dùng JWT cho web, lưu trong HttpOnly cookie + CSRF token.</p><p>Pattern tốt cho SaaS: <em>short-lived JWT access token (15\') + opaque refresh token trong HttpOnly cookie</em>. Vừa scale, vừa revoke được qua refresh endpoint.</p>',
            },
            {
              id: 'an-sec-1-2',
              authorEmail: 'mentor.linh@itss.local',
              content:
                '<p>Bổ sung: ngày nay với Auth.js / NextAuth / Clerk, bạn gần như không cần tự code phần này. Dùng lib chuẩn, ít sai lầm bảo mật hơn 100 lần.</p>',
            },
          ],
        },
        {
          id: 'th-sec-2',
          title: 'OWASP Top 10 dev fullstack nên thuộc lòng những gì?',
          authorEmail: 'alice@student.local',
          tags: ['owasp', 'web-security', 'checklist'],
          content:
            '<p>Em chuẩn bị làm khóa luận về một web app thanh toán. Em muốn nắm "must-know" về bảo mật trước khi viết code. OWASP Top 10 hiện tại gồm những gì và mục nào em nên focus nhất?</p>',
          answers: [
            {
              id: 'an-sec-2-1',
              authorEmail: 'mentor.an@itss.local',
              accepted: true,
              content:
                '<p>OWASP Top 10 (2021) — 3 mục đầu chiếm 80% vụ thực tế:</p><ol><li><strong>A01: Broken Access Control</strong> — user A xem được data của user B. Fix: check ownership ở <em>mọi</em> query (<code>WHERE userId = currentUser.id</code>). Đừng tin URL/ID client gửi.</li><li><strong>A02: Cryptographic Failures</strong> — lưu password plaintext / MD5. Dùng bcrypt/argon2. TLS mọi nơi.</li><li><strong>A03: Injection</strong> — SQL injection. Dùng parameterized query / ORM. KHÔNG concat string.</li></ol><p>Còn lại bạn nên đọc nhưng 3 cái trên là <em>bắt buộc</em>:</p><ul><li>A04 Insecure Design, A05 Security Misconfig, A06 Vulnerable Components (npm audit), A07 Auth failures, A08 Software Integrity (CI/CD), A09 Logging Failures, A10 SSRF.</li></ul><p>Cho dự án thanh toán, thêm:</p><ul><li><strong>Idempotency key</strong> trên mọi POST tạo giao dịch.</li><li><strong>Rate limiting</strong> per-user + per-IP.</li><li><strong>Audit log</strong> bất biến (append-only) cho mọi thay đổi balance.</li><li><strong>PCI-DSS</strong>: KHÔNG bao giờ tự lưu thẻ. Dùng Stripe/VNPay/MoMo, lưu token thôi.</li></ul>',
            },
            {
              id: 'an-sec-2-2',
              authorEmail: 'mentor.hieu@itss.local',
              content:
                '<p>Mẹo nhỏ cho hội đồng phản biện: chuẩn bị slide "threat model" 1 trang (asset, attacker, mitigation). Hội đồng sẽ rất ấn tượng vì 99% sinh viên bỏ qua phần này.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 10. UI/UX & DESIGN
    // ====================================================================
    {
      name: 'UI/UX & Design Collaboration',
      slug: 'ui-ux-design',
      category: 'OTHER',
      tags: ['ui', 'ux', 'figma', 'design-system'],
      description:
        'Design thinking, Figma cho dev, design system, accessibility. Cách phối hợp dev–designer mượt mà mà không "đổ lỗi qua lại".',
      threads: [
        {
          id: 'th-ux-1',
          title: 'Dev đọc Figma sao cho hiệu quả, đỡ phải hỏi designer 50 câu?',
          authorEmail: 'quynh@student.local',
          tags: ['figma', 'handoff', 'dev-design'],
          content:
            '<p>Em mới onboard, mỗi lần lấy design Figma là em phải hỏi designer từng spacing, từng màu. Mọi người chia sẻ workflow đọc Figma "pro" giúp em với?</p>',
          answers: [
            {
              id: 'an-ux-1-1',
              authorEmail: 'mentor.trang@itss.local',
              accepted: true,
              content:
                '<p>Dev hỏi nhiều là <strong>lỗi của designer</strong> 70% (không setup file đủ chi tiết) và 30% của dev (chưa biết các tính năng inspect). Phía dev bạn có thể làm:</p><ol><li><strong>Dev Mode</strong> trong Figma: chuyển sang tab này, click element nào sẽ thấy ngay CSS, spacing, color token.</li><li><strong>Variables / Tokens</strong>: nếu file có token (<code>color/primary/500</code>) → đối chiếu thẳng với design system code của bạn, đừng pick màu thủ công.</li><li><strong>Auto Layout</strong>: hiểu Auto Layout = Flexbox. <code>spacing</code> giữa item = <code>gap</code>, padding = padding. 1:1 với CSS.</li><li><strong>Component properties</strong>: hover instance để xem variant. Đỡ phải hỏi "trạng thái hover sao?".</li></ol><p>Phía designer: yêu cầu 3 thứ tối thiểu trong file handoff:</p><ul><li>Style guide (color/typography/spacing token).</li><li>States: default/hover/active/disabled/loading/empty/error.</li><li>Responsive breakpoint (mobile/tablet/desktop).</li></ul><p>Thiếu 3 thứ trên thì bạn được quyền "đẩy lại" file. Đây là chuẩn industry.</p>',
            },
          ],
        },
        {
          id: 'th-ux-2',
          title: 'Design system tự xây hay dùng shadcn/ui, MUI, Ant Design?',
          authorEmail: 'duc@student.local',
          tags: ['design-system', 'shadcn', 'mui'],
          content:
            '<p>Team em 4 dev đang startup. Tự xây design system từ đầu có khả thi không hay nên dùng cái có sẵn?</p>',
          answers: [
            {
              id: 'an-ux-2-1',
              authorEmail: 'mentor.trang@itss.local',
              accepted: true,
              content:
                '<p>Team 4 dev startup → <strong>KHÔNG tự xây từ đầu</strong>. Lý do: design system "thật" tốn 6–12 tháng cho 1 dev full-time. Bạn không có budget đó.</p><p>Khuyến nghị theo bối cảnh:</p><ul><li><strong>shadcn/ui</strong>: bạn cần kiểm soát hoàn toàn (copy code vào repo, không phải dependency). Phù hợp dự án cần branding riêng. Stack Tailwind + Radix → chuẩn 2024.</li><li><strong>MUI / Mantine</strong>: nhanh, nhiều component sẵn. Nhược: override style mệt, bundle to.</li><li><strong>Ant Design</strong>: hợp dashboard / admin tool nội bộ. Nhược: trông "ant design", khó tránh.</li></ul><p>Quy trình của mình ở startup: <em>shadcn/ui làm primitive → wrap thành component nội bộ (<code>Button</code>, <code>Card</code>) với props theo brand → designer làm Figma với cùng token color/spacing → dev và designer dùng chung "language"</em>.</p>',
            },
            {
              id: 'an-ux-2-2',
              authorEmail: 'mentor.tuan@itss.local',
              content:
                '<p>Bổ sung: ngày 1 hãy quyết một thứ — <strong>token system</strong> (color, spacing, radius, font). Token sai sửa toàn project. Token đúng từ đầu thì đổi theme, đổi brand chỉ là 1 file.</p>',
            },
          ],
        },
        {
          id: 'th-ux-3',
          title: 'Accessibility — dev fresher cần biết tối thiểu những gì?',
          authorEmail: 'my@student.local',
          tags: ['a11y', 'accessibility', 'wcag'],
          content:
            '<p>Phỏng vấn vừa rồi em bị hỏi "em có quan tâm accessibility không". Em ấp úng. Mọi người chỉ cho em "checklist tối thiểu" để không bị mất điểm nữa?</p>',
          answers: [
            {
              id: 'an-ux-3-1',
              authorEmail: 'mentor.trang@itss.local',
              accepted: true,
              content:
                '<p>7 thứ tối thiểu, áp được ngay tuần này:</p><ol><li><strong>Semantic HTML</strong>: <code>button</code> cho action, <code>a</code> cho navigate. KHÔNG <code>div onClick</code>.</li><li><strong>Alt text</strong> cho mọi <code>img</code> mang nội dung. Decorative thì <code>alt=""</code>.</li><li><strong>Label</strong> cho mọi input (<code>&lt;label htmlFor&gt;</code> hoặc <code>aria-label</code>).</li><li><strong>Keyboard navigation</strong>: Tab qua được mọi action, Esc đóng modal, Enter submit form. Test bằng cách rút chuột ra.</li><li><strong>Focus visible</strong>: đừng <code>outline: none</code> trừ khi có style focus thay thế.</li><li><strong>Color contrast ≥ 4.5:1</strong> cho text. Dùng plugin Stark / axe DevTools để check.</li><li><strong>aria-live</strong> cho thông báo động (toast, loading) để screen reader đọc được.</li></ol><p>Tool: <strong>axe DevTools</strong> extension. Chạy 1 click, ra 80% vấn đề. Lighthouse cũng có tab Accessibility.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 11. KỸ NĂNG MỀM & GIAO TIẾP
    // ====================================================================
    {
      name: 'Kỹ năng mềm, giao tiếp & tiếng Anh',
      slug: 'soft-skills-communication',
      category: 'OTHER',
      tags: ['english', 'communication', 'remote-work', 'writing'],
      description:
        'Viết email, giao tiếp với người không-kỹ-thuật, làm việc remote, học tiếng Anh chuyên ngành. Kỹ năng mà ít trường dạy nhưng quyết định 50% tốc độ thăng tiến.',
      threads: [
        {
          id: 'th-sk-1',
          title: 'Tiếng Anh dev đi làm cần đạt mức nào? Cách luyện trong 6 tháng?',
          authorEmail: 'long@student.local',
          tags: ['english', 'learning', 'career'],
          content:
            '<p>Em nói tiếng Anh kém, đọc tài liệu thì hiểu ~70%. Em đang muốn apply công ty nước ngoài / remote trong vòng 6 tháng. Roadmap thực tế nên thế nào ạ?</p>',
          answers: [
            {
              id: 'an-sk-1-1',
              authorEmail: 'mentor.hieu@itss.local',
              accepted: true,
              content:
                '<p>Tin vui: dev không cần tiếng Anh "đẹp", cần tiếng Anh <strong>đủ làm việc</strong>. Mức tối thiểu:</p><ul><li><strong>Đọc</strong>: hiểu tài liệu, hiểu PR comment → bạn đang ở mức này, OK rồi.</li><li><strong>Viết</strong>: comment code, viết PR description, Slack message. Đây là kỹ năng <em>quan trọng nhất</em> và dễ luyện nhất.</li><li><strong>Nghe / nói</strong>: standup, 1-1, demo. Mức B1 đủ làm việc, B2 thoải mái.</li></ul><p>Roadmap 6 tháng:</p><ol><li><strong>Tháng 1–2: Viết</strong>. Mỗi PR của bạn viết description bằng tiếng Anh. Mỗi tuần 1 bài blog kỹ thuật ngắn (300 từ). Dùng Grammarly, ChatGPT để chỉnh.</li><li><strong>Tháng 3–4: Nghe</strong>. Mỗi ngày 30 phút podcast (<em>Software Engineering Daily</em>, <em>Syntax</em>) hoặc YouTube conference talk có sub.</li><li><strong>Tháng 5–6: Nói</strong>. Đăng ký <em>italki</em> hoặc <em>Cambly</em>, 3 buổi/tuần với tutor. Tập mock interview tiếng Anh. Quay video tự xem lại.</li></ol><p>Mẹo: vào nhóm Discord open-source quốc tế, comment PR bằng tiếng Anh — vừa luyện vừa build portfolio.</p>',
            },
            {
              id: 'an-sk-1-2',
              authorEmail: 'mentor.linh@itss.local',
              content:
                '<p>Ở Money Forward team mình toàn người Nhật + 5 nước. Sau 1 năm mình tự tin nói tiếng Anh trong meeting bằng cách: trước mỗi meeting ghi 5 câu mình muốn nói ra giấy. Đơn giản nhưng cực hiệu quả cho người mới.</p>',
            },
          ],
        },
        {
          id: 'th-sk-2',
          title: 'Làm việc remote — cách "tồn tại" mà không bị forget?',
          authorEmail: 'chi@student.local',
          tags: ['remote', 'async', 'visibility'],
          content:
            '<p>Em vừa nhận offer remote cho công ty US. Hơi lo về việc làm sao team biết mình đang làm gì, làm sao gây ấn tượng từ xa.</p>',
          answers: [
            {
              id: 'an-sk-2-1',
              authorEmail: 'mentor.hieu@itss.local',
              accepted: true,
              content:
                '<p>Quy tắc vàng remote: <strong>over-communicate</strong>. Không thấy mặt nhau → mặc định là chưa biết.</p><ol><li><strong>Daily written update</strong>: Slack thread / Notion mỗi ngày. "Yesterday / Today / Blockers". 3 dòng đủ.</li><li><strong>PR description chi tiết</strong>: dev khác đọc 5 phút là hiểu thay vì gọi meeting 30 phút.</li><li><strong>Decision in writing</strong>: mọi quyết định kỹ thuật → viết thành RFC / ADR ngắn. Đăng kênh chung. Async-friendly.</li><li><strong>Overlap hours rõ ràng</strong>: thông báo lịch (vd 2h overlap với US team). Trong giờ overlap thì online và responsive.</li><li><strong>Tắt notification ngoài giờ</strong>: bảo vệ work-life balance, nếu không sẽ burnout sau 6 tháng.</li></ol><p>Visibility: cuối tuần / tháng viết 1 báo cáo ngắn về <em>impact</em> (không phải activity). "Tôi đã làm X, kết quả là Y user/revenue/perf number". Manager remote rất biết ơn vì họ không có context tự nhiên.</p>',
            },
            {
              id: 'an-sk-2-2',
              authorEmail: 'mentor.duy@itss.local',
              content:
                '<p>Một mẹo từ founder: nếu bạn không nói gì 2 tuần, manager sẽ tự lo "có vấn đề gì không". Chủ động ping mentor / manager 1-1 đều đặn — đầu tư rẻ nhất cho sự nghiệp remote.</p>',
            },
          ],
        },
        {
          id: 'th-sk-3',
          title: 'Giải thích vấn đề kỹ thuật cho stakeholder không-IT — kỹ năng nào quan trọng?',
          authorEmail: 'ha@student.local',
          tags: ['communication', 'stakeholder', 'soft-skill'],
          content:
            '<p>Em hay phải báo cáo bug, delay cho PM / sếp không biết kỹ thuật. Em giải thích xong mặt họ ngơ ngác. Có framework nào không ạ?</p>',
          answers: [
            {
              id: 'an-sk-3-1',
              authorEmail: 'mentor.duy@itss.local',
              accepted: true,
              content:
                '<p>Framework <strong>BLUF</strong> (Bottom Line Up Front) + analogy:</p><ol><li><strong>Câu đầu tiên = kết luận / tác động</strong>. KHÔNG mô tả nguyên nhân kỹ thuật trước.</li><li><strong>Tác động → con số / thời gian / tiền</strong> mà stakeholder hiểu.</li><li><strong>Nguyên nhân</strong> dùng analogy đời sống (DB = tủ hồ sơ, cache = sổ tay để bàn, deploy = mở lại nhà hàng).</li><li><strong>Action item + ETA</strong> rõ ràng.</li></ol><p>Ví dụ — KHÔNG hiệu quả:</p><blockquote><p>"Bug xảy ra do race condition giữa Redis cache và Postgres replica lag khi user đồng thời update profile..."</p></blockquote><p>Hiệu quả (BLUF):</p><blockquote><p>"Khoảng 200 user trong 1h qua thấy profile bị revert. Đã fix, đang deploy, xong trong 30 phút. Nguyên nhân: 2 hệ thống bên trong không đồng bộ kịp khi user cập nhật quá nhanh — như hai nhân viên ghi sổ chồng lên nhau. Em sẽ thêm cơ chế chống chồng chéo trong tuần này, sẽ không tái diễn."</p></blockquote><p>Stakeholder cần 3 thứ: <em>chuyện gì đang xảy ra, ảnh hưởng gì, khi nào hết</em>. Chi tiết kỹ thuật chỉ khi họ hỏi.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 12. DATABASE & SQL
    // ====================================================================
    {
      name: 'Database, SQL & Tối ưu truy vấn',
      slug: 'database-sql',
      category: 'BACKEND',
      tags: ['sql', 'postgres', 'index', 'query-tuning', 'database'],
      description:
        'Thiết kế schema, index strategy, đọc query plan, transaction & isolation level, migration an toàn. Nơi "khám bệnh" cho những câu query chậm và những bảng phình to.',
      threads: [
        {
          id: 'th-db-1',
          title: 'Index sao cho đúng — đánh index nhiều có làm chậm ghi không?',
          authorEmail: 'viet@student.local',
          tags: ['index', 'postgres', 'performance'],
          content:
            '<p>Em nghe nói "cứ query chậm thì thêm index". Nhưng sếp em bảo đừng lạm dụng index. Em rối quá: index lúc nào nên thêm, lúc nào hại ạ?</p>',
          answers: [
            {
              id: 'an-db-1-1',
              authorEmail: 'mentor.hoang@itss.local',
              accepted: true,
              content:
                '<p>Index là con dao hai lưỡi. Nguyên tắc của mình sau 12 năm làm DBA:</p><ul><li><strong>Index tăng tốc đọc, làm chậm ghi</strong>: mỗi <code>INSERT/UPDATE/DELETE</code> phải cập nhật mọi index liên quan. Bảng ghi nhiều (log, event) → ít index thôi.</li><li><strong>Đánh index cho cột xuất hiện ở <code>WHERE</code>, <code>JOIN</code>, <code>ORDER BY</code></strong> — và có tính chọn lọc cao (nhiều giá trị khác nhau). Index cột <code>gender</code> (2 giá trị) gần như vô dụng.</li><li><strong>Composite index có thứ tự</strong>: <code>(user_id, created_at)</code> phục vụ query lọc theo <code>user_id</code> rồi sort <code>created_at</code>. Đảo thứ tự là khác nhau hoàn toàn (quy tắc "leftmost prefix").</li></ul><p>Cách kiểm chứng: luôn chạy <code>EXPLAIN ANALYZE</code> trước và sau. Thấy <code>Seq Scan</code> trên bảng to → ứng viên cần index. Thấy <code>Index Scan</code> rồi → đừng thêm nữa.</p><p>Mẹo: tìm index thừa bằng <code>pg_stat_user_indexes</code> — cột <code>idx_scan = 0</code> nghĩa là index chưa từng được dùng, cân nhắc xóa.</p>',
            },
            {
              id: 'an-db-1-2',
              authorEmail: 'mentor.linh@itss.local',
              content:
                '<p>Bổ sung: với Postgres, để ý <strong>partial index</strong> (<code>WHERE status = \'active\'</code>) cho bảng có nhiều bản ghi "chết". Index nhỏ hơn, nhanh hơn, đỡ tốn ghi.</p>',
            },
          ],
        },
        {
          id: 'th-db-2',
          title: 'Transaction isolation level — REPEATABLE READ với READ COMMITTED khác gì?',
          authorEmail: 'tam@student.local',
          tags: ['transaction', 'isolation', 'concurrency'],
          content:
            '<p>Em làm chức năng trừ tồn kho, sợ bị race condition bán quá số lượng. Em đọc về isolation level mà rối. Mọi người giải thích thực tế giúp em với ạ?</p>',
          answers: [
            {
              id: 'an-db-2-1',
              authorEmail: 'mentor.hoang@itss.local',
              accepted: true,
              content:
                '<p>Tóm tắt thực dụng (Postgres):</p><ul><li><strong>READ COMMITTED</strong> (mặc định): mỗi câu lệnh thấy snapshot mới nhất đã commit. Có thể gặp "non-repeatable read" — đọc 2 lần trong cùng transaction ra 2 kết quả.</li><li><strong>REPEATABLE READ</strong>: cả transaction thấy 1 snapshot cố định. Postgres còn chống được phantom read ở mức này.</li><li><strong>SERIALIZABLE</strong>: như thể các transaction chạy tuần tự. An toàn nhất, nhưng có thể bị abort (<code>serialization failure</code>) và phải retry.</li></ul><p>Cho bài toán trừ tồn kho, đừng chỉ dựa vào isolation level. Hai cách chắc ăn:</p><ol><li><strong>Pessimistic lock</strong>: <code>SELECT quantity FROM products WHERE id = ? FOR UPDATE</code> — khóa dòng cho tới khi commit, các transaction khác phải chờ.</li><li><strong>Atomic update có điều kiện</strong>: <code>UPDATE products SET quantity = quantity - 1 WHERE id = ? AND quantity &gt; 0</code> rồi kiểm tra số dòng affected. Không trừ âm được, không cần lock tường minh.</li></ol><p>Mình thường ưu tiên cách 2 vì đơn giản và ít deadlock hơn.</p>',
            },
          ],
        },
      ],
    },

    // ====================================================================
    // 13. KHỞI NGHIỆP & SẢN PHẨM
    // ====================================================================
    {
      name: 'Khởi nghiệp, Product & Quản lý sản phẩm',
      slug: 'startup-product',
      category: 'CAREER',
      tags: ['startup', 'product', 'pm', 'mvp', 'business'],
      description:
        'Từ ý tưởng đến MVP, validate thị trường, làm việc với founder, lộ trình chuyển sang Product Manager. Góc nhìn từ người đã build sản phẩm thật.',
      threads: [
        {
          id: 'th-st-1',
          title: 'Sinh viên muốn làm startup — nên bắt đầu từ đâu để không "chết yểu"?',
          authorEmail: 'nhi@student.local',
          tags: ['startup', 'mvp', 'validation'],
          content:
            '<p>Nhóm em 3 đứa có ý tưởng app kết nối gia sư. Bọn em định code luôn 4 tháng cho xong rồi mới launch. Anh chị có kinh nghiệm startup tư vấn giúp tụi em với ạ?</p>',
          answers: [
            {
              id: 'an-st-1-1',
              authorEmail: 'mentor.duy@itss.local',
              accepted: true,
              content:
                '<p>Khoan code 4 tháng! Đây là cái bẫy số 1 của founder kỹ thuật. Thứ tự nên làm:</p><ol><li><strong>Validate vấn đề trước</strong>: phỏng vấn 20–30 gia sư và phụ huynh thật. Họ có thực sự "đau" không? Họ đang giải quyết bằng cách nào (Facebook group, trung tâm)?</li><li><strong>MVP không cần code</strong>: thử "concierge MVP" — bạn làm trung gian thủ công qua Zalo/Google Form trước. Nếu 10 người chịu trả tiền qua cách thủ công, ý tưởng có cửa.</li><li><strong>Đo 1 chỉ số duy nhất</strong>: ví dụ "số buổi học được kết nối thành công/tuần". Đừng xây 20 tính năng.</li><li><strong>Code MVP tối thiểu (2–4 tuần)</strong> chỉ khi đã có tín hiệu. Một landing page + form + thanh toán tay là đủ để bắt đầu.</li></ol><p>Câu thần chú: <em>"Fall in love with the problem, not the solution"</em>. 90% startup chết vì build thứ không ai cần, không phải vì code dở.</p>',
            },
            {
              id: 'an-st-1-2',
              authorEmail: 'mentor.phuong@itss.local',
              content:
                '<p>Từ góc PM: trước khi code, vẽ <strong>user journey</strong> của 1 phụ huynh từ lúc "cần gia sư" đến "thanh toán xong". Mỗi bước hỏi "chỗ này họ bỏ cuộc vì sao?". Bạn sẽ thấy 80% giá trị nằm ở 2-3 bước, tập trung vào đó thôi.</p>',
            },
          ],
        },
        {
          id: 'th-st-2',
          title: 'Dev muốn chuyển sang Product Manager — cần chuẩn bị gì?',
          authorEmail: 'quynh@student.local',
          tags: ['career-switch', 'product-manager', 'roadmap'],
          content:
            '<p>Em là dev 2 năm kinh nghiệm, thấy mình thích nói chuyện với user và định hình sản phẩm hơn là code thuần. Lộ trình chuyển sang PM cho người có nền kỹ thuật nên thế nào ạ?</p>',
          answers: [
            {
              id: 'an-st-2-1',
              authorEmail: 'mentor.phuong@itss.local',
              accepted: true,
              content:
                '<p>Nền kỹ thuật là lợi thế cực lớn của bạn (technical PM rất được săn). Lộ trình mình gợi ý:</p><ol><li><strong>Tận dụng vị trí hiện tại</strong>: xin tham gia viết spec, làm việc với PM team bạn. Tình nguyện làm "feature owner" cho 1 tính năng nhỏ end-to-end.</li><li><strong>Học khung tư duy PM</strong>: prioritization (RICE, MoSCoW), viết PRD, định nghĩa success metric, A/B testing cơ bản.</li><li><strong>Rèn user empathy</strong>: tự làm 5 buổi phỏng vấn user. Đây là kỹ năng dev hay thiếu nhất.</li><li><strong>Data literacy</strong>: SQL bạn đã có; học thêm phân tích funnel, retention, cohort. Biết "đọc" số để ra quyết định.</li><li><strong>Chuyển nội bộ trước</strong>: dễ hơn nhảy công ty. Công ty tin tưởng dev đã hiểu sản phẩm chuyển sang PM hơn người ngoài.</li></ol><p>Lưu ý: PM không phải "sếp của dev". Bạn sẽ mất quyền "tự code cho xong" và phải thuyết phục, ưu tiên, nói không rất nhiều. Một số dev nhớ cảm giác "ship code" và quay lại — thử trước khi cam kết.</p>',
            },
          ],
        },
      ],
    },
  ];

  // -----------------------------------------------------------------------
  // Persist channels + threads + answers
  // -----------------------------------------------------------------------
  for (const c of channels) {
    const chan = await prisma.channel.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        category: c.category,
        tags: c.tags,
        description: c.description,
        approved: true,
      },
      create: {
        name: c.name,
        slug: c.slug,
        category: c.category,
        tags: c.tags,
        description: c.description,
        approved: true,
      },
    });

    for (const th of c.threads) {
      const authorId = userIdByEmail[th.authorEmail];
      if (!authorId) {
        console.warn(`Thread ${th.id}: tác giả ${th.authorEmail} không tồn tại, bỏ qua.`);
        continue;
      }
      await prisma.thread.upsert({
        where: { id: th.id },
        update: {
          title: th.title,
          content: th.content,
          tags: th.tags,
          channelId: chan.id,
          authorId,
        },
        create: {
          id: th.id,
          title: th.title,
          content: th.content,
          tags: th.tags,
          channelId: chan.id,
          authorId,
        },
      });

      for (const a of th.answers) {
        const aAuthorId = userIdByEmail[a.authorEmail];
        if (!aAuthorId) {
          console.warn(`Answer ${a.id}: tác giả ${a.authorEmail} không tồn tại.`);
          continue;
        }
        await prisma.answer.upsert({
          where: { id: a.id },
          update: {
            content: a.content,
            threadId: th.id,
            authorId: aAuthorId,
            isAnonymous: !!a.isAnonymous,
            accepted: !!a.accepted,
          },
          create: {
            id: a.id,
            content: a.content,
            threadId: th.id,
            authorId: aAuthorId,
            isAnonymous: !!a.isAnonymous,
            accepted: !!a.accepted,
          },
        });
      }
    }
  }

  console.log(`✅ Seed xong: ${channels.length} kênh, ${mentorSeeds.length} cố vấn.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
