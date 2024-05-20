import { useState } from 'react';
import { Copy, Code, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FaviconPackage } from '@/pages/Index';
import { formatFileSize } from '@/utils/fileUtils';
import { motion } from 'framer-motion';

interface CodeGeneratorProps {
  faviconPackage: FaviconPackage;
}

const CodeGenerator = ({ faviconPackage }: CodeGeneratorProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Código copiado para a área de transferência!" });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-orange-500/40 via-transparent to-transparent p-[1px] rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:shadow-[0_0_45px_rgba(249,115,22,0.25)] backdrop-blur-sm transition-all duration-300 ease-in-out"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="bg-black/50 rounded-[11px] p-6 h-full w-full">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Código de Implementação</h3>
        </div>
        
        <Tabs defaultValue="html" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/50">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="files">Arquivos Gerados ({faviconPackage.files.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Cole este código na tag {'<head>'} do seu site.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(faviconPackage.htmlCode)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              
              <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                <pre className="text-sm text-secondary-foreground whitespace-pre-wrap font-mono">
                  {faviconPackage.htmlCode}
                </pre>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="files" className="mt-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Estes são os arquivos incluídos no seu pacote `.zip`.
              </p>
              <div className="border border-gray-700 rounded-lg">
                {faviconPackage.files.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-mono text-sm">{file.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatFileSize(file.blob.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default CodeGenerator;
