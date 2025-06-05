
import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  category: 'solar' | 'tariff' | 'hydro' | 'wind' | 'sustainability' | 'innovation';
}

const EnergyNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simular dados de notícias - em implementação real viria de API
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'ANEEL aprova novas regras para energia solar distribuída',
      summary: 'Agência Nacional de Energia Elétrica estabelece marco regulatório que beneficia consumidores com sistemas fotovoltaicos residenciais...',
      source: 'Agência Brasil',
      date: '2024-06-04',
      url: '#',
      category: 'solar'
    },
    {
      id: '2',
      title: 'Tarifa de energia elétrica tem redução de 3,2% em junho',
      summary: 'Bandeira tarifária verde representa economia média de R$ 15 na conta de luz para consumidores residenciais típicos...',
      source: 'Portal G1',
      date: '2024-06-03',
      url: '#',
      category: 'tariff'
    },
    {
      id: '3',
      title: 'Brasil acelera transição energética com novos investimentos',
      summary: 'Governo anuncia R$ 50 bilhões em recursos para projetos de energia renovável até 2030, priorizando eólica e solar...',
      source: 'Valor Econômico',
      date: '2024-06-02',
      url: '#',
      category: 'sustainability'
    },
    {
      id: '4',
      title: 'Inovação: bateria de grafeno promete revolução no armazenamento',
      summary: 'Nova tecnologia desenvolvida no Brasil pode aumentar capacidade de baterias em 300% e reduzir tempo de carregamento...',
      source: 'Época Negócios',
      date: '2024-06-01',
      url: '#',
      category: 'innovation'
    }
  ];

  const getCategoryIcon = (category: NewsItem['category']) => {
    const icons = {
      solar: '☀️',
      tariff: '💰',
      hydro: '💧',
      wind: '🌪️',
      sustainability: '♻️',
      innovation: '🔬'
    };
    return icons[category];
  };

  const getCategoryColor = (category: NewsItem['category']) => {
    const colors = {
      solar: 'text-yellow-600',
      tariff: 'text-green-600',
      hydro: 'text-blue-600',
      wind: 'text-gray-600',
      sustainability: 'text-emerald-600',
      innovation: 'text-purple-600'
    };
    return colors[category];
  };

  useEffect(() => {
    // Simular carregamento
    setTimeout(() => {
      setNews(mockNews);
      setLoading(false);
    }, 1000);
  }, []);

  const visibleNews = expanded ? news : news.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-emerald-700">
            <Newspaper className="h-5 w-5 mr-2" />
            Notícias do Setor Energético
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-emerald-700">
          <Newspaper className="h-5 w-5 mr-2" />
          Notícias do Setor Energético
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleNews.map(item => (
            <div key={item.id} className="border-l-4 border-emerald-200 pl-4 hover:bg-gray-50 rounded-r-lg p-3 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <span className={`text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {item.source} • {new Date(item.date).toLocaleDateString('pt-BR')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-emerald-600 hover:text-emerald-700 p-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {news.length > 3 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setExpanded(!expanded)}
              className="text-emerald-600 hover:text-emerald-700"
            >
              {expanded ? (
                <>
                  Ver Menos <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Ver Mais Notícias <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnergyNews;
