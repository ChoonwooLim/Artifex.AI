import sys
import os
os.chdir(r'D:\work\Artifex.AI\Wan2.2')
sys.argv = ['generate.py', '--task', 't2v-A14B', '--size', '480*832', 
            '--ckpt_dir', 'D:/mnt/d/XX-v01', '--prompt', 'test', 
            '--frame_num', '5', '--sample_steps', '2', 
            '--sample_guide_scale', '7.5', '--base_seed', '42',
            '--sample_solver', 'dpm++', '--offload_model', 'False']
exec(open('generate.py').read())