import React, { useState, useEffect } from 'react';

// === ICONS (using inline SVGs for portability) ===
// Using inline SVGs instead of a library like lucide-react to ensure it works without extra setup.

const Lightbulb = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
  </svg>
);

const BarChart = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
);

const BrainCircuit = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5a3 3 0 1 0-5.993.142M12 5a3 3 0 1 1 5.993.142M11 12h2"/><path d="M12 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0z"/><path d="M12 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z"/><path d="M6 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0z"/><path d="M18 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0z"/><path d="M12 19a3 3 0 1 0-5.993-.142"/><path d="M12 19a3 3 0 1 1 5.993.142"/><path d="M12 5v7m-6 0h12m-6 0v7"/>
    </svg>
);

const Globe = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20z"/><path d="M2 12h20"/>
  </svg>
);

const Trophy = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.87 18.75 7.03 19 6 19c-1.03 0-1.87-.25-2.97-.79-.5-.23-.97-.66-.97-1.21V14.66"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.13 18.75 16.97 19 18 19c1.03 0 1.87-.25 2.97-.79.5-.23-.97-.66-.97-1.21V14.66"/><path d="M12 12.01V22"/><path d="M8 4h8"/><path d="M12 4v8"/>
  </svg>
);

// Novo ícone: Network (para representar integração/ecossistema)
const Network = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="2" />
    <circle cx="18" cy="6" r="2" />
    <circle cx="12" cy="18" r="2" />
    <path d="M8 6h8" />
    <path d="M12 18V8" />
    <path d="M6 6l6 12" />
    <path d="M18 6l-6 12" />
  </svg>
);

const Quote = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1.25 0-2 .75-2 2v6c0 7 4 8 8 8Z"/><path d="M14 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1.25 0-2 .75-2 2v6c0 7 4 8 8 8Z"/>
    </svg>
);

// === DATA MOCKS ===
const heroSlides = [
    {
        headline: "Sua conta de luz parece um mistério?",
        subtext: "O Score Energy descomplica sua relação com a energia. Conectamos tecnologia e gamificação para você economizar de forma divertida e construir um futuro mais sustentável.",
        cta: "Descubra seu Score Energético"
    },
    {
        headline: "E se economizar energia virasse um jogo?",
        subtext: "Com o Score Energy, você cumpre desafios, sobe de nível e ganha recompensas reais. Transforme uma tarefa em uma jornada divertida para toda a família.",
        cta: "Comece a Jogar e Economizar"
    },
    {
        headline: "Tenha o poder de reduzir sua conta na palma da mão.",
        subtext: "Nossa tecnologia analisa seu consumo e revela oportunidades de economia que você nunca viu. Assuma o controle e veja seu impacto no bolso e no planeta.",
        cta: "Quero ter o Controle Agora!"
    }
];

const benefits = [
    { icon: <Lightbulb className="w-8 h-8 text-emerald-500" />, text: "Economia real e mensurável na sua conta de luz" },
    { icon: <BarChart className="w-8 h-8 text-emerald-500" />, text: "Acompanhamento claro do seu desempenho energético" },
    { icon: <BrainCircuit className="w-8 h-8 text-emerald-500" />, text: "Educação e consciência através da gamificação" },
    { icon: <Globe className="w-8 h-8 text-emerald-500" />, text: "Relatórios de impacto ambiental e carbono evitado" },
    { icon: <Trophy className="w-8 h-8 text-emerald-500" />, text: "Sistema de conquistas, níveis e recompensas" },
    { icon: <Network className="w-8 h-8 text-emerald-500" />, text: "Integração ao ecossistema ELETROBRAS" },
];

const testimonials = [
    { quote: "Nunca imaginei que poderia transformar minha conta de luz em um jogo. Reduzi 18% do consumo em 3 meses!", author: "Carla Menezes", location: "Florianópolis/SC" },
    { quote: "O mascote virtual e os desafios tornaram minha rotina mais consciente. Meus filhos também começaram a se interessar!", author: "Rafael Lima", location: "Salvador/BA" },
    { quote: "Usei o Score Energy em um projeto de escola pública, e os alunos ficaram fascinados. É mais que uma plataforma: é uma experiência.", author: "Juliana Rocha", location: "Professora de Geografia" }
];

const team = [
    { name: "Bruno Henrique Menegat", role: "Equipe", description: "Empreendedor com foco em soluções de eficiência energética.", img: "https://placehold.co/400x400/E2E8F0/475569?text=BHM" },
    { name: "Mateus", role: "Equipe", description: "Desenvolvimento e produto com olhar para impacto e usabilidade.", img: "https://placehold.co/400x400/E2E8F0/475569?text=MT" },
    { name: "3 integrante", role: "Equipe", description: "Operações e parcerias para ampliar o alcance do ecossistema.", img: "https://placehold.co/400x400/E2E8F0/475569?text=3I" }
];

const partners = [
    { company: "EnergyC", partner: "Luiz", img: "https://placehold.co/400x200/F1F5F9/334155?text=EnergyC" }
];

// === COMPONENTS ===

const RotatingHeroSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % heroSlides.length);
        }, 10000); // Change slide every 10 seconds

        return () => clearInterval(timer); // Cleanup timer on component unmount
    }, []);

    return (
        <section className="bg-slate-50 text-slate-800 relative overflow-hidden">
            <div className="container mx-auto px-6 py-24 md:py-32 text-center max-w-7xl relative z-10">
                <div className="relative h-48 md:h-56">
                    {heroSlides.map((slide, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-2000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                                {slide.headline}
                            </h1>
                            <p className="text-lg md:text-xl max-w-3xl mx-auto text-slate-600">
                                {slide.subtext}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="mt-10">
                     <a href="/registro" className="bg-emerald-500 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-emerald-600 transition-transform duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                        Cadastrar agora
                    </a>
                </div>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
                {heroSlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-emerald-500 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
};


const HowItWorksSection = () => (
    <section id="como-funciona" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Como o Score Energy Descomplica sua Vida</h2>
                <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">Em 5 passos simples, você assume o controle do seu consumo e começa a economizar.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
                <div className="text-center">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 text-3xl font-bold">1</div>
                    <h3 className="text-xl font-semibold mb-2">Cadastre-se</h3>
                    <p className="text-slate-600">Crie sua conta em poucos cliques e comece a acompanhar seu desempenho energético.</p>
                </div>
                <div className="text-center">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 text-3xl font-bold">2</div>
                    <h3 className="text-xl font-semibold mb-2">Personalize sua Jornada</h3>
                    <p className="text-slate-600">Crie seu perfil, responda a um quiz rápido e monte seu mascote virtual para receber dicas e missões.</p>
                </div>
                <div className="text-center">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 text-3xl font-bold">3</div>
                    <h3 className="text-xl font-semibold mb-2">Receba Recomendações</h3>
                    <p className="text-slate-600">Nossa IA analisa seu perfil para indicar práticas e equipamentos que reduzem custos e ajudam o planeta.</p>
                </div>
                <div className="text-center">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 text-3xl font-bold">4</div>
                    <h3 className="text-xl font-semibold mb-2">Conquiste Recompensas</h3>
                    <p className="text-slate-600">Participe de desafios, ganhe pontos, suba de nível e veja sua evolução no ranking de economia.</p>
                </div>
                <div className="text-center">
                    <div className="bg-emerald-100 text-emerald-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 text-3xl font-bold">5</div>
                    <h3 className="text-xl font-semibold mb-2">Seja um parceiro ELETROBRAS</h3>
                    <p className="text-slate-600">Amplie o impacto: mais economia, eficiência e educação energética.</p>
                </div>
            </div>
        </div>
    </section>
);

const BenefitsSection = () => (
    <section id="beneficios" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Vantagens que Iluminam seu Bolso e o Futuro</h2>
                <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">Mais que economia, uma nova experiência energética.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                        <div className="flex-shrink-0 bg-emerald-100 p-3 rounded-full">{benefit.icon}</div>
                        <p className="text-lg text-slate-700 font-medium pt-2">{benefit.text}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const NewsSection = () => (
    <section id="noticias" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Fique por Dentro</h2>
                <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">Notícias e tendências sobre energia, sustentabilidade e inovação no Brasil.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-50 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                    <img src="https://placehold.co/600x400/34D399/FFFFFF?text=Energia+Solar" alt="Energia Solar" className="w-full h-48 object-cover" />
                    <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-xl mb-2">O Futuro é Solar: Geração Distribuída no Brasil</h3>
                        <p className="text-slate-600 text-base flex-grow">Descubra os avanços e benefícios da energia solar para residências e pequenos negócios...</p>
                        <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold mt-4 inline-block self-start">Leia mais &rarr;</a>
                    </div>
                </div>
                <div className="bg-slate-50 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                    <img src="https://placehold.co/600x400/60A5FA/FFFFFF?text=Efici%C3%AAncia" alt="Eficiência Energética" className="w-full h-48 object-cover" />
                    <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-xl mb-2">5 Dicas Práticas para Reduzir sua Conta de Luz</h3>
                        <p className="text-slate-600 text-base flex-grow">Pequenas mudanças de hábito que fazem uma grande diferença no seu bolso e no meio ambiente...</p>
                        <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold mt-4 inline-block self-start">Leia mais &rarr;</a>
                    </div>
                </div>
                <div className="bg-slate-50 rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                     <img src="https://placehold.co/600x400/FBBF24/FFFFFF?text=Inova%C3%A7%C3%A3o" alt="Inovação" className="w-full h-48 object-cover" />
                    <div className="p-6 flex flex-col flex-grow">
                        <h3 className="font-bold text-xl mb-2">Gamificação: A Chave para o Consumo Consciente</h3>
                        <p className="text-slate-600 text-base flex-grow">Entenda como a mecânica de jogos está ajudando pessoas a adotarem hábitos mais sustentáveis...</p>
                        <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold mt-4 inline-block self-start">Leia mais &rarr;</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const TestimonialsSection = () => (
    <section id="depoimentos" className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Recomende e ganhe pontos extras no ecossistema ELETROBRAS</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start space-x-4">
                        <Trophy className="w-8 h-8 text-emerald-400" />
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Indique e ganhe pontos</h3>
                            <p className="text-slate-600">Convide amigos e organizações para o Score Energy. Cada cadastro confirmado rende pontos extras no ecossistema ELETROBRAS.</p>
                            <ul className="mt-4 space-y-2 text-slate-600">
                                <li>• Cadastro confirmado: +100 pontos</li>
                                <li>• Perfil inicial completo: +150 pontos</li>
                                <li>• Bônus de engajamento: conquiste badges e suba no ranking</li>
                            </ul>
                            <a href="#" className="inline-block mt-6 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors">Indicar agora</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const TeamSection = () => (
    <section id="equipe" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Nossa Equipe Apaixonada</h2>
                <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">Por trás do Score Energy, há uma equipe movida por inovação, sustentabilidade e o propósito de empoderar o consumidor brasileiro.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-x-6 gap-y-12">
                {team.map((member, index) => (
                    <div key={index} className="text-center flex flex-col items-center">
                        <img 
                            src={member.img} 
                            alt={`Foto de ${member.name}`} 
                            className="w-32 h-32 rounded-full mx-auto mb-4 shadow-lg object-cover" 
                            onError={(e) => { 
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/400x400/E2E8F0/475569?text=??';
                            }}
                        />
                        <h3 className="text-xl font-semibold text-slate-800">{member.name}</h3>
                        <p className="text-emerald-600 font-medium mb-2">{member.role}</p>
                        <p className="text-slate-600 text-sm">{member.description}</p>
                        <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold mt-3 inline-block">Saber mais →</a>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const PartnersSection = () => (
    <section id="parceiros" className="py-16 bg-slate-50">
        <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Parceiros</h2>
                <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">Juntos, ampliamos o impacto com economia, eficiência e educação energética.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 place-items-center">
                {partners.map((p, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-8 flex flex-col items-center justify-center text-center w-full max-w-md">
                        <div className="w-full max-w-[240px] h-20 flex items-center justify-center mb-4">
                            <img 
                                src={p.img} 
                                alt={`Logo ${p.company}`} 
                                className="max-h-16 object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = 'https://placehold.co/400x200/F1F5F9/334155?text=Parceiro';
                                }}
                            />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">{p.company}</h3>
                        <p className="text-sm text-slate-600">Parceiro: {p.partner}</p>
                        <p className="text-slate-600 text-sm mt-3 min-h-[48px]">Espaço para descrição da parceria.</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const CallToActionSection = () => (
    <section id="comece-agora" className="bg-emerald-600 text-white">
        <div className="container mx-auto px-6 py-20 text-center max-w-7xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para ter o controle da sua energia na palma da mão?</h2>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 text-emerald-100">
                Junte-se ao Score Energy. Cadastre-se e inicie uma jornada de economia, diversão e sustentabilidade.
            </p>
            <a href="/registro" className="bg-white text-emerald-600 font-bold py-4 px-8 rounded-full text-lg hover:bg-slate-100 transition-transform duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Cadastrar agora
            </a>
        </div>
    </section>
);

// === MAIN APP COMPONENT ===
export default function App() {
    return (
        <div className="bg-white font-sans antialiased">
            <main>
                <RotatingHeroSection />
                <HowItWorksSection />
                <BenefitsSection />
                <TestimonialsSection />
                <NewsSection />
                <TeamSection />
                <PartnersSection />
                <CallToActionSection />
            </main>
        </div>
    );
}
