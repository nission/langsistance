// 简单的测试脚本，用于验证mock功能是否正常工作
// 这个文件不是应用的一部分，仅用于测试

import axios from 'axios';
import { API_BASE_URL } from './constants';

// 测试函数
async function testMockAPI() {
  console.log('Testing mock API...');
  
  try {
    // 测试 health endpoint
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('Health endpoint response:', healthResponse.data);
    
    // 测试 latest_answer endpoint
    const latestAnswerResponse = await axios.get(`${API_BASE_URL}/latest_answer`);
    console.log('Latest answer endpoint response:', latestAnswerResponse.data);
    
    // 测试 query_public_knowledge endpoint
    const knowledgeResponse = await axios.get(`${API_BASE_URL}/query_public_knowledge`);
    console.log('Public knowledge endpoint response:', knowledgeResponse.data);
    
    // 测试 query_knowledge endpoint
    const queryKnowledgeResponse = await axios.get(`${API_BASE_URL}/query_knowledge?userId=mock-user-789&query=Python`);
    console.log('Query knowledge endpoint response:', queryKnowledgeResponse.data);
    
    // 测试 create_knowledge endpoint
    const createKnowledgeResponse = await axios.post(`${API_BASE_URL}/create_knowledge`, {
      userId: "test-user",
      question: "测试问题",
      description: "测试描述",
      answer: "测试答案",
      public: true,
      modelName: "test-model",
      toolId: 1,
      params: "{}"
    });
    console.log('Create knowledge endpoint response:', createKnowledgeResponse.data);
    
    // 测试 update_knowledge endpoint
    const updateKnowledgeResponse = await axios.post(`${API_BASE_URL}/update_knowledge`, {
      userId: "test-user",
      knowledgeId: 125,
      question: "更新的测试问题",
      description: "更新的测试描述",
      answer: "更新的测试答案"
    });
    console.log('Update knowledge endpoint response:', updateKnowledgeResponse.data);
    
    // 测试 delete_knowledge endpoint
    const deleteKnowledgeResponse = await axios.post(`${API_BASE_URL}/delete_knowledge`, {
      userId: "test-user",
      knowledgeId: 125
    });
    console.log('Delete knowledge endpoint response:', deleteKnowledgeResponse.data);
    
    // 测试 copy_knowledge endpoint
    const copyKnowledgeResponse = await axios.post(`${API_BASE_URL}/copy_knowledge`, {
      userId: "test-user",
      knowledgeId: 1
    });
    console.log('Copy knowledge endpoint response:', copyKnowledgeResponse.data);
    
    console.log('Mock API test completed successfully!');
  } catch (error) {
    console.error('Mock API test failed:', error);
  }
}

// 如果在浏览器环境中运行，执行测试
if (typeof window !== 'undefined') {
  testMockAPI();
}

export default testMockAPI;